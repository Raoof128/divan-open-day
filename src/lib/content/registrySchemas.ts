import { z } from 'zod';

import { POETS } from '../../contracts/content';

export const PUBLIC_USES = [
  'website_display',
  'downloadable_share_card',
  'event_print',
  'archival_hosting',
] as const;

export const CONTRIBUTOR_ROLES = [
  'translator',
  'source_editor',
  'persian_literary_reviewer',
  'english_editor',
  'cultural_reviewer',
  'rights_reviewer',
  'final_approver',
  'performer',
] as const;

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

const identifierSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(IDENTIFIER_PATTERN, 'Identifiers must use lowercase kebab-case.');

const nonBlankText = (maximumLength: number) =>
  z
    .string()
    .min(1)
    .max(maximumLength)
    .refine((value) => value.trim().length > 0, 'Text cannot be blank.');

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'Use an ISO calendar date.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, 'Date must be a real calendar date.');

function addDuplicateIdIssues(
  records: readonly { readonly id: string }[],
  addIssue: (index: number, message: string) => void,
): void {
  const firstIndexById = new Map<string, number>();
  records.forEach((record, index) => {
    const firstIndex = firstIndexById.get(record.id);
    if (firstIndex === undefined) {
      firstIndexById.set(record.id, index);
      return;
    }

    addIssue(index, `Duplicate identifier ${record.id}; first seen at index ${firstIndex}.`);
  });
}

function hasUniqueStrings(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const editionRecordSchema = z
  .object({
    id: identifierSchema,
    status: z.enum(['active', 'retired']),
    poet: z.enum(POETS),
    source_language: z.literal('fa'),
    citation: nonBlankText(1_000),
    public_credit: nonBlankText(500),
  })
  .strict();

export const editionRegistrySchema = z
  .object({
    schema_version: z.literal(1),
    editions: z.array(editionRecordSchema),
  })
  .strict()
  .superRefine((registry, context) => {
    addDuplicateIdIssues(registry.editions, (index, message) => {
      context.addIssue({ code: 'custom', path: ['editions', index, 'id'], message });
    });
  });

const contributorRecordSchema = z
  .object({
    id: identifierSchema,
    status: z.enum(['active', 'inactive']),
    display_name: nonBlankText(300),
    roles: z
      .array(z.enum(CONTRIBUTOR_ROLES))
      .min(1)
      .max(CONTRIBUTOR_ROLES.length)
      .refine(hasUniqueStrings, 'Contributor roles cannot contain duplicates.'),
  })
  .strict();

export const contributorRegistrySchema = z
  .object({
    schema_version: z.literal(1),
    contributors: z.array(contributorRecordSchema),
  })
  .strict()
  .superRefine((registry, context) => {
    addDuplicateIdIssues(registry.contributors, (index, message) => {
      context.addIssue({ code: 'custom', path: ['contributors', index, 'id'], message });
    });
  });

const territorySchema = z.union([
  z.literal('worldwide'),
  z.string().regex(/^[A-Z]{2}$/u, 'Territories must be worldwide or ISO alpha-2 codes.'),
]);

const permissionRecordSchema = z
  .object({
    id: identifierSchema,
    status: z.enum(['active', 'revoked']),
    kind: z.enum(['translation', 'audio', 'asset']),
    subject_id: identifierSchema,
    rights_owner: nonBlankText(300),
    evidence_reference: nonBlankText(500),
    permitted_uses: z
      .array(z.enum(PUBLIC_USES))
      .min(1)
      .max(PUBLIC_USES.length)
      .refine(hasUniqueStrings, 'Permitted uses cannot contain duplicates.'),
    attribution: nonBlankText(500),
    modification_permitted: z.boolean(),
    territories: z
      .array(territorySchema)
      .min(1)
      .max(16)
      .refine(hasUniqueStrings, 'Territories cannot contain duplicates.'),
    expires_on: isoDateSchema.nullable(),
  })
  .strict();

export const permissionRegistrySchema = z
  .object({
    schema_version: z.literal(1),
    permissions: z.array(permissionRecordSchema),
  })
  .strict()
  .superRefine((registry, context) => {
    addDuplicateIdIssues(registry.permissions, (index, message) => {
      context.addIssue({ code: 'custom', path: ['permissions', index, 'id'], message });
    });
  });

const approvalRecordSchema = z
  .object({
    id: identifierSchema,
    status: z.enum(['current', 'superseded', 'revoked']),
    item_id: identifierSchema,
    authoring_sha256: z.string().regex(SHA256_PATTERN),
    approved_by: identifierSchema,
    approved_at: isoDateSchema,
  })
  .strict();

export const approvalRegistrySchema = z
  .object({
    schema_version: z.literal(1),
    approvals: z.array(approvalRecordSchema),
  })
  .strict()
  .superRefine((registry, context) => {
    addDuplicateIdIssues(registry.approvals, (index, message) => {
      context.addIssue({ code: 'custom', path: ['approvals', index, 'id'], message });
    });
  });

const safeAssetPathSchema = z
  .string()
  .max(300)
  .regex(/^(?:audio|images|fonts)\/[A-Za-z0-9._/-]+$/u)
  .refine(
    (value) => value.split('/').every((segment) => segment !== '.' && segment !== '..'),
    'Asset paths cannot traverse directories.',
  );

const assetBaseShape = {
  id: identifierSchema,
  status: z.enum(['active', 'disabled']),
  path: safeAssetPathSchema,
  sha256: z.string().regex(SHA256_PATTERN),
  bytes: z.number().int().positive().max(100_000_000),
  permission_record_id: identifierSchema,
};

const audioAssetSchema = z
  .object({
    ...assetBaseShape,
    kind: z.literal('audio'),
    mime_type: z.enum(['audio/mpeg', 'audio/ogg']),
    performer_id: identifierSchema,
    duration_seconds: z.number().int().min(20).max(60),
  })
  .strict();

const nonAudioAssetSchema = z
  .object({
    ...assetBaseShape,
    kind: z.enum(['image', 'font']),
    mime_type: z.enum([
      'image/avif',
      'image/webp',
      'image/png',
      'image/svg+xml',
      'font/woff2',
    ]),
    performer_id: z.null(),
    duration_seconds: z.null(),
  })
  .strict();

const assetRecordSchema = z.discriminatedUnion('kind', [
  audioAssetSchema,
  nonAudioAssetSchema,
]);

export const assetRegistrySchema = z
  .object({
    schema_version: z.literal(1),
    assets: z.array(assetRecordSchema),
  })
  .strict()
  .superRefine((registry, context) => {
    addDuplicateIdIssues(registry.assets, (index, message) => {
      context.addIssue({ code: 'custom', path: ['assets', index, 'id'], message });
    });
  });

export const registryBundleSchema = z
  .object({
    editions: editionRegistrySchema,
    contributors: contributorRegistrySchema,
    permissions: permissionRegistrySchema,
    approvals: approvalRegistrySchema,
    assets: assetRegistrySchema,
  })
  .strict();

export type RegistryBundle = z.infer<typeof registryBundleSchema>;
export type EditionRecord = z.infer<typeof editionRecordSchema>;
export type ContributorRecord = z.infer<typeof contributorRecordSchema>;
export type PermissionRecord = z.infer<typeof permissionRecordSchema>;
export type ApprovalRecord = z.infer<typeof approvalRecordSchema>;
export type AssetRecord = z.infer<typeof assetRecordSchema>;
