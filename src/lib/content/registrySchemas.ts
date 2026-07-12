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

// ISO 3166-1 alpha-2 assigned codes from ISO/TC 46 N1127 (2024-02-29).
// The sorted static snapshot makes territory-policy changes reviewable in Git.
const ISO_3166_1_ALPHA_2_CODES = [
  'AD',
  'AE',
  'AF',
  'AG',
  'AI',
  'AL',
  'AM',
  'AO',
  'AQ',
  'AR',
  'AS',
  'AT',
  'AU',
  'AW',
  'AX',
  'AZ',
  'BA',
  'BB',
  'BD',
  'BE',
  'BF',
  'BG',
  'BH',
  'BI',
  'BJ',
  'BL',
  'BM',
  'BN',
  'BO',
  'BQ',
  'BR',
  'BS',
  'BT',
  'BV',
  'BW',
  'BY',
  'BZ',
  'CA',
  'CC',
  'CD',
  'CF',
  'CG',
  'CH',
  'CI',
  'CK',
  'CL',
  'CM',
  'CN',
  'CO',
  'CR',
  'CU',
  'CV',
  'CW',
  'CX',
  'CY',
  'CZ',
  'DE',
  'DJ',
  'DK',
  'DM',
  'DO',
  'DZ',
  'EC',
  'EE',
  'EG',
  'EH',
  'ER',
  'ES',
  'ET',
  'FI',
  'FJ',
  'FK',
  'FM',
  'FO',
  'FR',
  'GA',
  'GB',
  'GD',
  'GE',
  'GF',
  'GG',
  'GH',
  'GI',
  'GL',
  'GM',
  'GN',
  'GP',
  'GQ',
  'GR',
  'GS',
  'GT',
  'GU',
  'GW',
  'GY',
  'HK',
  'HM',
  'HN',
  'HR',
  'HT',
  'HU',
  'ID',
  'IE',
  'IL',
  'IM',
  'IN',
  'IO',
  'IQ',
  'IR',
  'IS',
  'IT',
  'JE',
  'JM',
  'JO',
  'JP',
  'KE',
  'KG',
  'KH',
  'KI',
  'KM',
  'KN',
  'KP',
  'KR',
  'KW',
  'KY',
  'KZ',
  'LA',
  'LB',
  'LC',
  'LI',
  'LK',
  'LR',
  'LS',
  'LT',
  'LU',
  'LV',
  'LY',
  'MA',
  'MC',
  'MD',
  'ME',
  'MF',
  'MG',
  'MH',
  'MK',
  'ML',
  'MM',
  'MN',
  'MO',
  'MP',
  'MQ',
  'MR',
  'MS',
  'MT',
  'MU',
  'MV',
  'MW',
  'MX',
  'MY',
  'MZ',
  'NA',
  'NC',
  'NE',
  'NF',
  'NG',
  'NI',
  'NL',
  'NO',
  'NP',
  'NR',
  'NU',
  'NZ',
  'OM',
  'PA',
  'PE',
  'PF',
  'PG',
  'PH',
  'PK',
  'PL',
  'PM',
  'PN',
  'PR',
  'PS',
  'PT',
  'PW',
  'PY',
  'QA',
  'RE',
  'RO',
  'RS',
  'RU',
  'RW',
  'SA',
  'SB',
  'SC',
  'SD',
  'SE',
  'SG',
  'SH',
  'SI',
  'SJ',
  'SK',
  'SL',
  'SM',
  'SN',
  'SO',
  'SR',
  'SS',
  'ST',
  'SV',
  'SX',
  'SY',
  'SZ',
  'TC',
  'TD',
  'TF',
  'TG',
  'TH',
  'TJ',
  'TK',
  'TL',
  'TM',
  'TN',
  'TO',
  'TR',
  'TT',
  'TV',
  'TW',
  'TZ',
  'UA',
  'UG',
  'UM',
  'US',
  'UY',
  'UZ',
  'VA',
  'VC',
  'VE',
  'VG',
  'VI',
  'VN',
  'VU',
  'WF',
  'WS',
  'YE',
  'YT',
  'ZA',
  'ZM',
  'ZW',
] as const;

const ISO_3166_1_ALPHA_2_CODE_SET: ReadonlySet<string> = new Set(
  ISO_3166_1_ALPHA_2_CODES,
);

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
  z
    .string()
    .regex(/^[A-Z]{2}$/u, 'Territories must be worldwide or ISO alpha-2 codes.')
    .refine(
      (value) => ISO_3166_1_ALPHA_2_CODE_SET.has(value),
      'Territory must be an assigned ISO 3166-1 alpha-2 code.',
    ),
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
      .length(PUBLIC_USES.length)
      .refine(hasUniqueStrings, 'Permitted uses cannot contain duplicates.'),
    attribution: nonBlankText(500),
    modification_permitted: z.boolean(),
    territories: z
      .array(territorySchema)
      .min(1)
      .max(ISO_3166_1_ALPHA_2_CODES.length)
      .refine(hasUniqueStrings, 'Territories cannot contain duplicates.')
      .refine(
        (values) => !values.includes('worldwide') || values.length === 1,
        'Worldwide must be the only territory when present.',
      ),
    effective_on: isoDateSchema,
    expires_on: isoDateSchema.nullable(),
  })
  .strict()
  .refine(
    (permission) =>
      permission.expires_on === null ||
      permission.effective_on <= permission.expires_on,
    {
      message: 'Permission expiry cannot precede its effective date.',
      path: ['expires_on'],
    },
  );

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
  .regex(
    /^(?:audio|fonts|icons|images)\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u,
    'Asset paths must use an approved root and nonempty path segments.',
  )
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
    kind: z.enum(['font', 'icon', 'image', 'ornament']),
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

function hasMatchingAssetContract(asset: z.infer<typeof assetRecordSchema>): boolean {
  switch (asset.kind) {
    case 'audio':
      return (
        asset.path.startsWith('audio/') &&
        ((asset.mime_type === 'audio/mpeg' && asset.path.endsWith('.mp3')) ||
          (asset.mime_type === 'audio/ogg' && asset.path.endsWith('.ogg')))
      );
    case 'font':
      return (
        asset.path.startsWith('fonts/') &&
        asset.mime_type === 'font/woff2' &&
        asset.path.endsWith('.woff2')
      );
    case 'icon':
    case 'ornament':
      return (
        asset.path.startsWith('icons/') &&
        asset.mime_type === 'image/svg+xml' &&
        asset.path.endsWith('.svg')
      );
    case 'image':
      return (
        asset.path.startsWith('images/') &&
        ((asset.mime_type === 'image/avif' && asset.path.endsWith('.avif')) ||
          (asset.mime_type === 'image/webp' && asset.path.endsWith('.webp')) ||
          (asset.mime_type === 'image/png' && asset.path.endsWith('.png')))
      );
  }
}

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

    registry.assets.forEach((asset, index) => {
      if (!hasMatchingAssetContract(asset)) {
        context.addIssue({
          code: 'custom',
          path: ['assets', index],
          message: 'Asset kind, root, MIME type, and extension must match.',
        });
      }
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
