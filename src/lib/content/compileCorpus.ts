import type { PublicContentItem } from '../../contracts/content';
import {
  authoringContentItemSchema,
  type AuthoringContentItem,
} from './authoringSchema';
import { canonicalSha256 } from './canonical';
import { compileItem } from './compileItem';
import {
  PUBLIC_USES,
  registryBundleSchema,
  type CONTRIBUTOR_ROLES,
  type AssetRecord,
  type ContributorRecord,
  type PermissionRecord,
  type RegistryBundle,
} from './registrySchemas';

export type CorpusProfile = 'fixture' | 'production';

export interface CompileCorpusInput {
  readonly profile: CorpusProfile;
  readonly items: readonly unknown[];
  readonly registries: unknown;
  readonly buildDate: string;
}

export interface CompiledCorpus {
  readonly items: readonly PublicContentItem[];
  readonly hafezCount: number;
  readonly rumiCount: number;
  readonly totalCount: number;
  readonly productionEligible: boolean;
}

type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const FIXTURE_SENTINEL_PATTERN =
  /TEST ONLY|NOT POETRY|NOT TRANSLATION|NOT INTERPRETATION|SYNTHETIC/iu;
const FIXTURE_ID_PATTERN = /(?:^|[-_/])(?:test-only|fixture)(?:[-_/]|$)/iu;

function parseBuildDate(value: string): string {
  if (!ISO_DATE_PATTERN.test(value)) {
    throw new Error('Build date must be a real ISO calendar date.');
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('Build date must be a real ISO calendar date.');
  }

  return value;
}

function compareCodeUnits(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function containsFixtureMarker(value: unknown, seen: Set<object>): boolean {
  if (typeof value === 'string') {
    return FIXTURE_SENTINEL_PATTERN.test(value) || FIXTURE_ID_PATTERN.test(value);
  }

  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return false;
  }

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.some((entry) => containsFixtureMarker(entry, seen));
    }

    return Object.values(value).some((entry) => containsFixtureMarker(entry, seen));
  } finally {
    seen.delete(value);
  }
}

function indexById<T extends { readonly id: string }>(records: readonly T[]): Map<string, T> {
  return new Map(records.map((record) => [record.id, record]));
}

function requireContributor(
  contributors: ReadonlyMap<string, ContributorRecord>,
  contributorId: string,
  role: ContributorRole,
  itemId: string,
): ContributorRecord {
  const contributor = contributors.get(contributorId);
  if (
    contributor === undefined ||
    contributor.status !== 'active' ||
    !contributor.roles.includes(role)
  ) {
    throw new Error(
      `Item ${itemId} is missing an active ${role} contributor for ${contributorId}.`,
    );
  }

  return contributor;
}

interface PermissionExpectation {
  readonly id: string;
  readonly kind: PermissionRecord['kind'];
  readonly subjectId: string;
  readonly attribution: string;
  readonly rightsOwner?: string;
}

function requirePermission(
  permissions: ReadonlyMap<string, PermissionRecord>,
  expectation: PermissionExpectation,
  buildDate: string,
  itemId: string,
): PermissionRecord {
  const permission = permissions.get(expectation.id);
  if (permission === undefined) {
    throw new Error(`Item ${itemId} is missing permission ${expectation.id}.`);
  }

  if (permission.status !== 'active') {
    throw new Error(`Item ${itemId} permission ${expectation.id} is not active.`);
  }

  if (
    permission.kind !== expectation.kind ||
    permission.subject_id !== expectation.subjectId
  ) {
    throw new Error(
      `Item ${itemId} permission ${expectation.id} has the wrong evidence use or subject.`,
    );
  }

  if (!PUBLIC_USES.every((use) => permission.permitted_uses.includes(use))) {
    throw new Error(`Item ${itemId} permission ${expectation.id} has the wrong public use.`);
  }

  // This release is publicly reachable without geofencing, so a country-only
  // permission cannot cover the actual distribution territory.
  if (!permission.territories.includes('worldwide')) {
    throw new Error(
      `Item ${itemId} permission ${expectation.id} is territorially insufficient.`,
    );
  }

  if (permission.expires_on !== null && permission.expires_on < buildDate) {
    throw new Error(
      `Item ${itemId} permission ${expectation.id} expired before the build date.`,
    );
  }

  if (permission.attribution !== expectation.attribution) {
    throw new Error(`Item ${itemId} permission ${expectation.id} has stale attribution.`);
  }

  if (
    expectation.rightsOwner !== undefined &&
    permission.rights_owner !== expectation.rightsOwner
  ) {
    throw new Error(`Item ${itemId} permission ${expectation.id} has a stale rights owner.`);
  }

  return permission;
}

function requireAudioAsset(
  item: AuthoringContentItem,
  registries: RegistryBundle,
  contributors: ReadonlyMap<string, ContributorRecord>,
  permissions: ReadonlyMap<string, PermissionRecord>,
  buildDate: string,
): void {
  if (!item.audio.enabled) {
    return;
  }

  const candidates = registries.assets.assets.filter(
    (asset) => asset.path === item.audio.asset_path,
  );
  if (candidates.length !== 1) {
    throw new Error(
      `Item ${item.id} must join exactly one enabled audio asset for ${item.audio.asset_path}.`,
    );
  }

  const asset: AssetRecord | undefined = candidates[0];
  if (
    asset === undefined ||
    asset.kind !== 'audio' ||
    asset.status !== 'active' ||
    asset.mime_type !== item.audio.mime_type ||
    asset.duration_seconds !== item.audio.duration_seconds ||
    asset.performer_id !== item.audio.performer_id ||
    asset.permission_record_id !== item.audio.permission_record_id
  ) {
    throw new Error(`Item ${item.id} has stale or invalid enabled audio asset evidence.`);
  }

  requireContributor(contributors, item.audio.performer_id, 'performer', item.id);
  requirePermission(
    permissions,
    {
      id: item.audio.permission_record_id,
      kind: 'audio',
      subjectId: asset.id,
      attribution: item.audio.performer_public_credit,
    },
    buildDate,
    item.id,
  );
}

function validateItemEvidence(
  item: AuthoringContentItem,
  registries: RegistryBundle,
  buildDate: string,
): void {
  const editions = indexById(registries.editions.editions);
  const contributors = indexById(registries.contributors.contributors);
  const permissions = indexById(registries.permissions.permissions);
  const approvals = indexById(registries.approvals.approvals);

  const edition = editions.get(item.source.edition_id);
  if (
    edition === undefined ||
    edition.status !== 'active' ||
    edition.poet !== item.poet ||
    edition.source_language !== item.source.source_language ||
    edition.citation !== item.source.edition_citation ||
    edition.public_credit !== item.source.edition_public_credit
  ) {
    throw new Error(`Item ${item.id} is missing its active approved edition join.`);
  }

  for (const translatorId of item.translation.translator_ids) {
    requireContributor(contributors, translatorId, 'translator', item.id);
  }

  const reviewerGroups = [
    ['source_editor', item.review.source_editor_ids],
    ['persian_literary_reviewer', item.review.persian_literary_reviewer_ids],
    ['english_editor', item.review.english_editor_ids],
    ['cultural_reviewer', item.review.cultural_reviewer_ids],
    ['cultural_reviewer', item.reflection.reviewer_ids],
    ['rights_reviewer', item.review.rights_reviewer_ids],
  ] as const;
  for (const [role, contributorIds] of reviewerGroups) {
    for (const contributorId of contributorIds) {
      requireContributor(contributors, contributorId, role, item.id);
    }
  }

  const translatorIds = new Set(item.translation.translator_ids);
  const accountableReviewerIds = reviewerGroups.flatMap(([, ids]) => ids);
  if (accountableReviewerIds.every((reviewerId) => translatorIds.has(reviewerId))) {
    throw new Error(`Item ${item.id} cannot be approved only by its translator.`);
  }

  requirePermission(
    permissions,
    {
      id: item.translation.permission_record_id,
      kind: 'translation',
      subjectId: item.id,
      attribution: item.translation.public_credit,
      rightsOwner: item.translation.rights_owner,
    },
    buildDate,
    item.id,
  );

  const approval = approvals.get(item.review.approval_record_id);
  if (approval === undefined) {
    throw new Error(`Item ${item.id} is missing final approval evidence.`);
  }

  if (approval.status !== 'current') {
    throw new Error(`Item ${item.id} final approval is not current or approved.`);
  }

  if (approval.item_id !== item.id) {
    throw new Error(`Item ${item.id} final approval is bound to the wrong item.`);
  }

  if (approval.approved_at !== item.review.approved_at) {
    throw new Error(`Item ${item.id} has stale final approval date metadata.`);
  }

  if (approval.approved_at > buildDate) {
    throw new Error(`Item ${item.id} final approval is future-effective.`);
  }

  if (approval.authoring_sha256 !== canonicalSha256(item)) {
    throw new Error(
      `Item ${item.id} final approval SHA-256 digest does not match the canonical authoring item.`,
    );
  }

  requireContributor(contributors, approval.approved_by, 'final_approver', item.id);
  requireAudioAsset(item, registries, contributors, permissions, buildDate);
}

function assertProductionMinimums(items: readonly AuthoringContentItem[]): void {
  const hafezCount = items.filter((item) => item.poet === 'hafez').length;
  const rumiCount = items.filter((item) => item.poet === 'rumi').length;
  const totalCount = items.length;

  if (hafezCount < 24) {
    throw new Error(
      `Production corpus requires at least 24 Hafez items; received ${String(hafezCount)}.`,
    );
  }

  if (rumiCount < 16) {
    throw new Error(
      `Production corpus requires at least 16 Rumi items; received ${String(rumiCount)}.`,
    );
  }

  if (totalCount < 40) {
    throw new Error(
      `Production corpus requires at least 40 total items; received ${String(totalCount)}.`,
    );
  }
}

export function compileCorpus(input: CompileCorpusInput): CompiledCorpus {
  if (input.profile !== 'fixture' && input.profile !== 'production') {
    throw new Error('Corpus profile must be explicitly fixture or production.');
  }

  const buildDate = parseBuildDate(input.buildDate);
  const registries = registryBundleSchema.parse(input.registries);
  const authoringItems = input.items.map((item) => authoringContentItemSchema.parse(item));

  const seenItemIds = new Set<string>();
  for (const item of authoringItems) {
    if (seenItemIds.has(item.id)) {
      throw new Error(`Duplicate item ID ${item.id}.`);
    }
    seenItemIds.add(item.id);
  }

  if (
    input.profile === 'production' &&
    authoringItems.some((item) => item.status === 'draft')
  ) {
    throw new Error('Production corpus cannot contain draft authoring items.');
  }

  const compilableItems = authoringItems.filter((item) => item.status !== 'disabled');
  if (input.profile === 'production') {
    assertProductionMinimums(compilableItems);
    if (containsFixtureMarker([authoringItems, registries], new Set<object>())) {
      throw new Error('Production corpus cannot contain fixture IDs or TEST ONLY sentinels.');
    }
  }

  const compiledItems = compilableItems.map((item) => {
    validateItemEvidence(item, registries, buildDate);
    return compileItem(item);
  });
  compiledItems.sort((left, right) => compareCodeUnits(left.id, right.id));

  const hafezCount = compiledItems.filter((item) => item.poet === 'hafez').length;
  const rumiCount = compiledItems.filter((item) => item.poet === 'rumi').length;

  return {
    items: compiledItems,
    hafezCount,
    rumiCount,
    totalCount: compiledItems.length,
    productionEligible: input.profile === 'production',
  };
}
