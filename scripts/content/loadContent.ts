import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';

import { isAlias, parseAllDocuments, visit } from 'yaml';

import {
  authoringContentItemSchema,
  type AuthoringContentItem,
} from '../../src/lib/content/authoringSchema';
import {
  registryBundleSchema,
  type RegistryBundle,
} from '../../src/lib/content/registrySchemas';
import { containsRemoteResource } from '../../src/lib/content/remoteResource';

export type ContentLoadProfile = 'fixture' | 'production';

export interface LoadContentPrivateOptions {
  readonly projectRoot: string;
  readonly profile: ContentLoadProfile;
}

export interface LoadedPrivateContent {
  readonly items: readonly AuthoringContentItem[];
  readonly registries: RegistryBundle;
  readonly privateValues: ReadonlySet<string>;
}

const REGISTRY_FILES = {
  approvals: 'approvals.yaml',
  assets: 'assets.yaml',
  contributors: 'contributors.yaml',
  editions: 'editions.yaml',
  permissions: 'permissions.yaml',
} as const;

const ALLOWED_ROOT_FILES = new Set([
  'README.md',
  ...Object.values(REGISTRY_FILES),
]);
const FIXTURE_SENTINEL_PATTERN =
  /TEST ONLY|NOT POETRY|NOT TRANSLATION|NOT INTERPRETATION|SYNTHETIC/iu;
const FIXTURE_ID_PATTERN = /(?:^|[-_/])(?:test-only|fixture)(?:[-_/]|$)/iu;
const MAX_YAML_BYTES = 1_000_000;

function describeYamlError(sourceName: string, messages: readonly string[]): Error {
  return new Error(`Invalid YAML in ${sourceName}: ${messages.join('; ')}`);
}

function inspectParsedValue(
  value: unknown,
  sourceName: string,
  seen: Set<object>,
): void {
  if (typeof value === 'string') {
    if (containsRemoteResource(value.trim())) {
      throw new Error(`Remote resources are not allowed in ${sourceName}.`);
    }
    return;
  }

  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return;
  }

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      for (const entry of value) {
        inspectParsedValue(entry, sourceName, seen);
      }
      return;
    }

    for (const entry of Object.values(value)) {
      inspectParsedValue(entry, sourceName, seen);
    }
  } finally {
    seen.delete(value);
  }
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

function addStrings(
  target: Set<string>,
  values: readonly (string | null | undefined)[],
): void {
  for (const value of values) {
    if (typeof value === 'string' && value !== '') {
      target.add(value);
    }
  }
}

export function derivePrivateSourceValues(
  rawItems: readonly unknown[],
  rawRegistries: unknown,
): ReadonlySet<string> {
  const items = rawItems.map((item) => authoringContentItemSchema.parse(item));
  const registries = registryBundleSchema.parse(rawRegistries);
  const privateValues = new Set<string>();
  const publicValues = new Set<string>();

  for (const item of items) {
    addStrings(publicValues, [
      item.id,
      item.source.work_en,
      item.source.work_fa,
      item.source.edition_public_credit,
      item.source.reference_value,
      item.source.opening_hemistich_fa,
      item.translation.public_credit,
      item.reflection.english,
      item.audio.enabled ? item.audio.asset_path : null,
      item.audio.enabled ? item.audio.mime_type : null,
      item.audio.enabled ? item.audio.performer_public_credit : null,
      ...item.text.persian_lines,
      ...item.text.english_lines,
    ]);
    addStrings(privateValues, [
      item.source.edition_id,
      item.source.edition_citation,
      item.source.page_reference,
      item.translation.rights_owner,
      item.translation.permission_record_id,
      item.translation.moral_rights_notes,
      item.audio.enabled ? item.audio.performer_id : null,
      item.audio.enabled ? item.audio.permission_record_id : null,
      item.review.approval_record_id,
      item.review.approved_at,
      ...item.translation.translator_ids,
      ...item.reflection.reviewer_ids,
      ...item.review.source_editor_ids,
      ...item.review.persian_literary_reviewer_ids,
      ...item.review.english_editor_ids,
      ...item.review.cultural_reviewer_ids,
      ...item.review.rights_reviewer_ids,
    ]);
  }

  for (const edition of registries.editions.editions) {
    addStrings(privateValues, [edition.id, edition.citation]);
    addStrings(publicValues, [edition.public_credit]);
  }
  for (const contributor of registries.contributors.contributors) {
    addStrings(privateValues, [contributor.id, contributor.display_name]);
  }
  for (const permission of registries.permissions.permissions) {
    addStrings(privateValues, [
      permission.id,
      permission.subject_id,
      permission.rights_owner,
      permission.evidence_reference,
    ]);
    addStrings(publicValues, [permission.attribution]);
  }
  for (const approval of registries.approvals.approvals) {
    addStrings(privateValues, [
      approval.id,
      approval.authoring_sha256,
      approval.approved_by,
      approval.approved_at,
    ]);
  }
  for (const asset of registries.assets.assets) {
    addStrings(privateValues, [
      asset.id,
      asset.permission_record_id,
      asset.performer_id,
    ]);
    addStrings(publicValues, [asset.path]);
  }

  for (const publicValue of publicValues) {
    privateValues.delete(publicValue);
  }
  return privateValues;
}

export function parseStrictYaml(source: string, sourceName: string): unknown {
  const documents = parseAllDocuments(source, {
    prettyErrors: false,
    schema: 'core',
    strict: true,
    uniqueKeys: true,
    version: '1.2',
  });

  if (documents.length !== 1) {
    throw new Error(`${sourceName} must contain exactly one YAML document.`);
  }

  const document = documents[0];
  if (document === undefined) {
    throw new Error(`${sourceName} must contain exactly one YAML document.`);
  }

  const messages = [...document.errors, ...document.warnings].map(
    (problem) => problem.message,
  );
  if (messages.length > 0) {
    throw describeYamlError(sourceName, messages);
  }

  visit(document, (_key, node) => {
    if (isAlias(node)) {
      throw new Error(`YAML aliases and anchors are not allowed in ${sourceName}.`);
    }

    if (
      typeof node === 'object' &&
      node !== null &&
      'anchor' in node &&
      typeof node.anchor === 'string' &&
      node.anchor !== ''
    ) {
      throw new Error(`YAML aliases and anchors are not allowed in ${sourceName}.`);
    }

    if (
      typeof node === 'object' &&
      node !== null &&
      'tag' in node &&
      typeof node.tag === 'string'
    ) {
      throw new Error(`Custom YAML tags are not allowed in ${sourceName}.`);
    }
  });

  let value: unknown;
  try {
    value = document.toJS({ maxAliasCount: 0, mapAsMap: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown parse failure';
    throw new Error(`Invalid YAML in ${sourceName}: ${message}`, { cause: error });
  }

  inspectParsedValue(value, sourceName, new Set<object>());
  return value;
}

function assertContainedPath(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Content path would escape outside content-private.');
  }
}

export async function readStrictYamlFile(
  contentRoot: string,
  relativePath: string,
): Promise<unknown> {
  const resolvedRoot = path.resolve(contentRoot);
  const candidate = path.resolve(resolvedRoot, relativePath);
  assertContainedPath(resolvedRoot, candidate);

  const rootRealPath = await realpath(resolvedRoot);
  const stat = await lstat(candidate);
  if (stat.isSymbolicLink()) {
    throw new Error(`Symlinked content is not allowed: ${relativePath}.`);
  }
  if (!stat.isFile()) {
    throw new Error(`Content input must be a regular file: ${relativePath}.`);
  }
  if (stat.size > MAX_YAML_BYTES) {
    throw new Error(`Content YAML exceeds the size limit: ${relativePath}.`);
  }

  const candidateRealPath = await realpath(candidate);
  assertContainedPath(rootRealPath, candidateRealPath);

  try {
    return parseStrictYaml(
      await readFile(candidateRealPath, 'utf8'),
      relativePath,
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unable to read ${relativePath}.`, { cause: error });
  }
}

async function assertRegularDirectory(directory: string, label: string): Promise<void> {
  const stat = await lstat(directory);
  if (stat.isSymbolicLink()) {
    throw new Error(`Symlinked ${label} directory is not allowed.`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`${label} must be a regular directory.`);
  }
}

async function discoverItemFiles(
  contentRoot: string,
  poet: 'hafez' | 'rumi',
): Promise<readonly string[]> {
  const directory = path.join(contentRoot, poet);
  let entries;
  try {
    await assertRegularDirectory(directory, poet);
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? error.code
        : undefined;
    if (code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  return entries
    .toSorted((left, right) => left.name.localeCompare(right.name, 'en'))
    .map((entry) => {
      if (entry.isSymbolicLink()) {
        throw new Error(`Symlinked content is not allowed: ${poet}/${entry.name}.`);
      }
      if (!entry.isFile() || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.yaml$/u.test(entry.name)) {
        throw new Error(`Unexpected content-private entry: ${poet}/${entry.name}.`);
      }
      return `${poet}/${entry.name}`;
    });
}

async function assertExpectedRootEntries(contentRoot: string): Promise<void> {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlinked content is not allowed: ${entry.name}.`);
    }

    if (entry.name === 'hafez' || entry.name === 'rumi') {
      if (!entry.isDirectory()) {
        throw new Error(`Unexpected content-private entry: ${entry.name}.`);
      }
      continue;
    }

    if (!entry.isFile() || !ALLOWED_ROOT_FILES.has(entry.name)) {
      throw new Error(`Unexpected content-private entry: ${entry.name}.`);
    }
  }
}

function parseAuthoringItem(
  value: unknown,
  relativePath: string,
  expectedPoet: 'hafez' | 'rumi',
): AuthoringContentItem {
  const result = authoringContentItemSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid authoring schema in ${relativePath}: ${result.error.message}`);
  }
  if (result.data.poet !== expectedPoet) {
    throw new Error(`${relativePath} contains an authoring item for the wrong poet.`);
  }
  if (`${result.data.id}.yaml` !== path.basename(relativePath)) {
    throw new Error(`${relativePath} filename must exactly match its authoring item ID.`);
  }
  return result.data;
}

export async function loadContentPrivate(
  options: LoadContentPrivateOptions,
): Promise<LoadedPrivateContent> {
  const contentRoot = path.resolve(options.projectRoot, 'content-private');
  await assertRegularDirectory(contentRoot, 'content-private');
  await assertExpectedRootEntries(contentRoot);

  const [hafezFiles, rumiFiles] = await Promise.all([
    discoverItemFiles(contentRoot, 'hafez'),
    discoverItemFiles(contentRoot, 'rumi'),
  ]);
  const itemFiles = [...hafezFiles, ...rumiFiles];
  if (options.profile === 'production' && itemFiles.length === 0) {
    throw new Error(
      'Production build blocked: no approved production corpus exists in content-private.',
    );
  }

  const rawItems = await Promise.all(
    itemFiles.map((relativePath) => readStrictYamlFile(contentRoot, relativePath)),
  );
  const items = rawItems.map((value, index) => {
    const relativePath = itemFiles[index];
    if (relativePath === undefined) {
      throw new Error('Content discovery produced an incoherent item list.');
    }
    return parseAuthoringItem(
      value,
      relativePath,
      relativePath.startsWith('hafez/') ? 'hafez' : 'rumi',
    );
  });

  const registryEntries = await Promise.all(
    Object.entries(REGISTRY_FILES).map(async ([name, relativePath]) =>
      [name, await readStrictYamlFile(contentRoot, relativePath)] as const,
    ),
  );
  const rawRegistries: Record<string, unknown> =
    Object.fromEntries(registryEntries);
  const registryResult = registryBundleSchema.safeParse(rawRegistries);
  if (!registryResult.success) {
    throw new Error(`Invalid private registry schema: ${registryResult.error.message}`);
  }

  if (
    options.profile === 'production' &&
    containsFixtureMarker([items, registryResult.data], new Set<object>())
  ) {
    throw new Error('Production content cannot contain fixture IDs or TEST ONLY sentinels.');
  }

  return {
    items,
    registries: registryResult.data,
    privateValues: derivePrivateSourceValues(items, registryResult.data),
  };
}
