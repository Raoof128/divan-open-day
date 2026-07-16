import { z } from 'zod';

import type { AuthoringContentItem } from './authoringSchema';
import { canonicalPersianIdentity } from './canonicalIdentity';
import {
  assertMachineAuthorityCurrent,
  type MachineAuthorityBinding,
} from './reviewAuthority';

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

const manifestRecordSchema = z
  .object({
    item_id: z.string().min(1).max(128).regex(IDENTIFIER_PATTERN),
    poet: z.enum(['hafez', 'rumi']),
    canonical_identity_hash: z.string().regex(SHA256_PATTERN),
    english_span_hash: z.string().regex(SHA256_PATTERN),
    persian_span_hash: z.string().regex(SHA256_PATTERN),
    mapping_hash: z.string().regex(SHA256_PATTERN),
  })
  .strict();

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export const productionSelectionManifestSchema = z
  .object({
    schema_version: z.literal(1),
    records: z.array(manifestRecordSchema).length(120),
  })
  .strict()
  .superRefine((manifest, context) => {
    const hafezCount = manifest.records.filter(
      (record) => record.poet === 'hafez',
    ).length;
    const rumiCount = manifest.records.length - hafezCount;
    if (hafezCount !== 60 || rumiCount !== 60) {
      context.addIssue({
        code: 'custom',
        path: ['records'],
        message:
          'Production selection requires exactly 60 Hafez and 60 Rumi IDs.',
      });
    }

    const ids = manifest.records.map((record) => record.item_id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        path: ['records'],
        message: 'Production selection contains a duplicate item ID.',
      });
    }

    const expectedOrder = [...manifest.records].sort(
      (left, right) =>
        compareCodeUnits(left.poet, right.poet) ||
        compareCodeUnits(left.item_id, right.item_id),
    );
    if (
      expectedOrder.some(
        (record, index) => record.item_id !== manifest.records[index]?.item_id,
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['records'],
        message:
          'Production selection records are not in canonical poet/ID order.',
      });
    }
  });

export type ProductionSelectionManifest = z.infer<
  typeof productionSelectionManifestSchema
>;

function machineBinding(item: AuthoringContentItem): MachineAuthorityBinding {
  return {
    englishSourceId: item.source.english_source_id,
    englishSourceHash: item.source.english_source_sha256,
    englishReference: item.source.english_source_reference,
    persianSourceId: item.source.edition_id,
    persianSourceHash: item.source.persian_source_sha256,
    persianReference: `${item.source.reference_type}:${item.source.reference_value}`,
    canonicalIdentity: canonicalPersianIdentity(item),
    englishLines: item.text.english_lines,
    persianLines: item.text.persian_lines,
    mapping: item.text.mapping.map((entry) => ({
      englishIndex: entry.english_index,
      persianIndices: entry.persian_indices,
    })),
  };
}

function normalizedSourceLine(value: string): string {
  return value.normalize('NFC').replaceAll(/\s+/gu, ' ').trim();
}

/**
 * Proves that the explicit 120-ID manifest describes the exact current corpus,
 * not merely 120 directory entries. Authority digests are checked again here
 * so a stale record cannot remain selected while waiting for later compilation.
 */
export function validateProductionSelectionManifest(
  items: readonly AuthoringContentItem[],
  manifestInput: unknown,
  buildDate: string,
): ProductionSelectionManifest {
  const manifest = productionSelectionManifestSchema.parse(manifestInput);
  const itemsById = new Map(items.map((item) => [item.id, item]));
  if (itemsById.size !== items.length) {
    throw new Error('Production content contains a duplicate item ID.');
  }
  if (items.length !== manifest.records.length) {
    throw new Error(
      'Production selection does not cover the exact corpus item set.',
    );
  }

  const hafezIdentities = new Set<string>();
  const rumiEnglishSpans = new Set<string>();
  const rumiPersianLines = new Set<string>();
  const rumiMappingIdentities = new Set<string>();

  for (const record of manifest.records) {
    const item = itemsById.get(record.item_id);
    if (item === undefined || item.poet !== record.poet) {
      throw new Error(
        `Production selection does not resolve item ${record.item_id} with the declared poet.`,
      );
    }
    if (item.status !== 'approved') {
      throw new Error(
        `Production selection includes archived or unapproved item ${item.id}.`,
      );
    }
    if (item.review_authority.kind !== 'machine_alignment') {
      throw new Error(
        `Production selection item ${item.id} lacks machine authority.`,
      );
    }

    const authority = item.review_authority;
    assertMachineAuthorityCurrent(machineBinding(item), authority, buildDate);
    if (
      record.canonical_identity_hash !== authority.canonicalIdentityHash ||
      record.english_span_hash !== authority.englishSpanHash ||
      record.persian_span_hash !== authority.persianSpanHash ||
      record.mapping_hash !== authority.mappingHash
    ) {
      throw new Error(
        `Production selection has stale authority digests for ${item.id}.`,
      );
    }

    if (item.poet === 'hafez') {
      if (
        item.source.reference_type !== 'ghazal' ||
        !/^Ghazal [1-9]\d*$/u.test(item.source.reference_value) ||
        item.source.opening_hemistich_fa === null
      ) {
        throw new Error(
          `Hafez item ${item.id} is composite or lacks one stable ghazal identity.`,
        );
      }
      if (hafezIdentities.has(authority.canonicalIdentityHash)) {
        throw new Error(
          'Production selection contains a duplicate Hafez canonical ghazal.',
        );
      }
      hafezIdentities.add(authority.canonicalIdentityHash);
      continue;
    }

    if (
      item.source.reference_type !== 'masnavi' ||
      !/^Nicholson section [0-9]+$/u.test(item.source.reference_value) ||
      item.text.english_lines.length < 2 ||
      item.text.persian_lines.length < 2
    ) {
      throw new Error(
        `Rumi item ${item.id} lacks a coherent traceable source span.`,
      );
    }

    const englishIdentity = `${item.source.english_source_id}:${item.source.english_source_reference}:${authority.englishSpanHash}`;
    if (rumiEnglishSpans.has(englishIdentity)) {
      throw new Error(
        'Production selection reuses a Rumi English source span.',
      );
    }
    rumiEnglishSpans.add(englishIdentity);

    if (rumiMappingIdentities.has(authority.mappingHash)) {
      throw new Error(
        'Production selection contains a duplicate Rumi mapping identity.',
      );
    }
    rumiMappingIdentities.add(authority.mappingHash);

    for (const line of item.text.persian_lines) {
      const lineIdentity = `${item.source.edition_id}:${normalizedSourceLine(line)}`;
      if (rumiPersianLines.has(lineIdentity)) {
        throw new Error(
          'Production selection contains overlapping Rumi Persian spans.',
        );
      }
      rumiPersianLines.add(lineIdentity);
    }
  }

  return manifest;
}
