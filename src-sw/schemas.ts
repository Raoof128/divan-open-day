import { z } from 'zod';

import { MAX_RELEASE_ASSET_BYTES } from '../src/contracts/release';

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SAFE_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/u;
const HTML_PATTERN = /<(?:!--|![A-Za-z]|!\[|\?|\/?[A-Za-z][^>]*>)/u;
const MARKDOWN_PATTERNS = [
  /(?:^|\n)(?:\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s|(?: {4}| {0,3}\t)\S)/u,
  /(?:^|\n) {0,3}(?:(?:\*[ \t]*){3,}|(?:_[ \t]*){3,}|(?:-[ \t]*){3,})(?:\n|$)/u,
  /!?\[[^\]]*\]\([^)]*\)/u,
  /!?\[[^\]]+\]\s*\[[^\]]*\]/u,
  /(?:^|\n)\s{0,3}\[[^\]]+\]:\s*\S/u,
  /(?:^|\n)[^\n]+\n\s{0,3}(?:=+|-+)\s*(?:\n|$)/u,
  /(?:^|\n)\s{0,3}(?:`{3,}|~{3,})/u,
  /(?:^|[^\p{L}\p{N}])\*(?![\s*])(?:[^*\n]*\S)?\*(?!\*)/u,
  /(?:^|[^\p{L}\p{N}])_(?![\s_])(?:[^_\n]*\S)?_(?![\p{L}\p{N}_])/u,
  /(?:\*\*|__|~~|`)/u,
];
const BIDI_CONTROL_PATTERN = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
const WORD_LIKE_PATTERN =
  /[\p{L}\p{N}][\p{L}\p{N}\p{M}\u200C\u200D]*(?:['’.-][\p{L}\p{N}][\p{L}\p{N}\p{M}\u200C\u200D]*)*/gu;

export const OFFLINE_RELEASE_BYTES_HARD_LIMIT = 8_000_000;

function publicText(maximumLength: number) {
  return z
    .string()
    .min(1)
    .max(maximumLength)
    .refine((value) => value.trim().length > 0, 'Text cannot be blank.')
    .refine(
      (value) =>
        !HTML_PATTERN.test(value) &&
        !MARKDOWN_PATTERNS.some((pattern) => pattern.test(value)),
      'Raw HTML or Markdown is not allowed.',
    )
    .refine(
      (value) => !BIDI_CONTROL_PATTERN.test(value),
      'Bidi control characters are not allowed.',
    );
}

function isSafeRelativePath(value: string): boolean {
  if (
    value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.includes('?') ||
    value.includes('#') ||
    !SAFE_PATH_PATTERN.test(value)
  ) {
    return false;
  }
  return value
    .split('/')
    .every(
      (segment) =>
        segment.length > 0 &&
        segment !== '.' &&
        segment !== '..' &&
        !segment.startsWith('.'),
    );
}

function isSafeAudioPath(value: string): boolean {
  return (
    value.startsWith('audio/') &&
    isSafeRelativePath(value) &&
    /\.(?:mp3|ogg)$/u.test(value)
  );
}

function wordCount(value: string): number {
  return value.match(WORD_LIKE_PATTERN)?.length ?? 0;
}

const sourceSchema = z
  .object({
    workEn: publicText(200),
    workFa: publicText(200),
    editionPublicCredit: publicText(500),
    reference: publicText(200),
    openingHemistichFa: publicText(500).nullable(),
  })
  .strict();

const textSchema = z
  .object({
    persianLines: z.array(publicText(500)).min(1).max(6),
    englishLines: z.array(publicText(500)).min(1).max(6),
    alignment: z.enum(['line', 'stanza']),
  })
  .strict();

const audioSchema = z
  .object({
    assetPath: z.string().max(300).refine(isSafeAudioPath),
    mimeType: z.enum(['audio/mpeg', 'audio/ogg']),
    durationSeconds: z.number().int().min(20).max(60),
    performerCredit: publicText(300),
  })
  .strict()
  .superRefine((audio, context) => {
    const expected = audio.assetPath.endsWith('.mp3')
      ? 'audio/mpeg'
      : 'audio/ogg';
    if (audio.mimeType !== expected) {
      context.addIssue({
        code: 'custom',
        path: ['mimeType'],
        message: 'Audio MIME type must match the path.',
      });
    }
  });

export const offlineContentItemSchema = z
  .object({
    id: z.string().min(1).max(128).regex(ID_PATTERN),
    schemaVersion: z.literal(2),
    poet: z.enum(['hafez', 'rumi']),
    mode: z.enum(['open_the_divan', 'moment_of_reflection']),
    display: z
      .object({
        visualVariant: z.enum(['garden_night', 'lamp_constellation']),
        accent: z.enum(['pomegranate', 'lapis']),
      })
      .strict(),
    source: sourceSchema,
    text: textSchema,
    translationClassification: z.enum([
      'society_translation',
      'licensed_translation',
      'public_domain_translation',
      'adaptation',
    ]),
    translationCredit: publicText(300),
    reflection: publicText(1_200)
      .refine((value) => {
        const count = wordCount(value);
        return count >= 45 && count <= 90;
      })
      .nullable(),
    verificationStatus: z.enum([
      'HUMAN_ATTESTED',
      'MACHINE_VERIFIED',
      'MACHINE_VERIFIED_WITH_DISCLOSURE',
    ]),
    disclosures: z.array(publicText(1_200)).max(20),
    audio: audioSchema.nullable(),
    contentHash: z.string().regex(SHA256_PATTERN),
  })
  .strict()
  .superRefine((item, context) => {
    const validPair =
      (item.poet === 'hafez' && item.mode === 'open_the_divan') ||
      (item.poet === 'rumi' && item.mode === 'moment_of_reflection');
    if (!validPair) {
      context.addIssue({
        code: 'custom',
        path: ['mode'],
        message: 'Poet and mode do not form an approved pairing.',
      });
    }
    if (item.poet === 'hafez' && item.source.openingHemistichFa === null) {
      context.addIssue({
        code: 'custom',
        path: ['source', 'openingHemistichFa'],
        message: 'Hafez items require an opening hemistich.',
      });
    }
  });

export const offlineCorpusSchema = z
  .object({
    schemaVersion: z.literal(2),
    releaseId: z.string().regex(ID_PATTERN),
    items: z.array(offlineContentItemSchema),
  })
  .strict()
  .superRefine((corpus, context) => {
    const ids = new Set<string>();
    corpus.items.forEach((item, index) => {
      if (ids.has(item.id)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'id'],
          message: 'Content item IDs must be unique.',
        });
      }
      ids.add(item.id);
    });
  });

export const offlineReleaseDescriptorSchema = z
  .object({
    releaseId: z.string().regex(ID_PATTERN),
    schemaVersion: z.literal(2),
    builtAt: z
      .string()
      .datetime({ offset: true })
      .refine((value) => new Date(value).toISOString() === value),
    buildProfile: z.enum(['fixture', 'production']),
    productionEligible: z.boolean(),
    itemCount: z.number().int().nonnegative(),
    hafezCount: z.number().int().nonnegative(),
    rumiCount: z.number().int().nonnegative(),
    contentPath: z.string().regex(/^\/content\/[a-f0-9]{64}\.json$/u),
    contentSha256: z.string().regex(SHA256_PATTERN),
    assetManifestPath: z.string().regex(/^\/assets\/[a-f0-9]{64}\.json$/u),
    assetManifestSha256: z.string().regex(SHA256_PATTERN),
  })
  .strict()
  .superRefine((release, context) => {
    if (release.itemCount !== release.hafezCount + release.rumiCount) {
      context.addIssue({
        code: 'custom',
        path: ['itemCount'],
        message: 'Poet counts must add up to the total.',
      });
    }
    if (
      release.productionEligible !==
      (release.buildProfile === 'production')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['productionEligible'],
        message: 'Release eligibility must match its profile.',
      });
    }
    if (release.contentPath !== `/content/${release.contentSha256}.json`) {
      context.addIssue({
        code: 'custom',
        path: ['contentPath'],
        message: 'Content path must match its SHA-256.',
      });
    }
    if (
      release.assetManifestPath !==
      `/assets/${release.assetManifestSha256}.json`
    ) {
      context.addIssue({
        code: 'custom',
        path: ['assetManifestPath'],
        message: 'Asset-manifest path must match its SHA-256.',
      });
    }
  });

const MIME_TYPES = [
  'application/manifest+json',
  'audio/mpeg',
  'audio/ogg',
  'font/woff2',
  'image/avif',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'text/css',
  'text/html',
  'text/javascript',
] as const;

const FIXED_MIME = new Map<string, (typeof MIME_TYPES)[number]>([
  ['icon.svg', 'image/svg+xml'],
  ['index.html', 'text/html'],
  ['manifest.webmanifest', 'application/manifest+json'],
  ['offline.html', 'text/html'],
  ['service-worker.js', 'text/javascript'],
]);
const VITE_ASSET_PATTERN =
  /^assets\/[A-Za-z0-9][A-Za-z0-9._-]*-[a-f0-9]{16}\.(css|js|woff2|avif|png|svg|webp)$/u;
const VITE_MIME = new Map<string, (typeof MIME_TYPES)[number]>([
  ['avif', 'image/avif'],
  ['css', 'text/css'],
  ['js', 'text/javascript'],
  ['png', 'image/png'],
  ['svg', 'image/svg+xml'],
  ['webp', 'image/webp'],
  ['woff2', 'font/woff2'],
]);

const offlineAssetSchema = z
  .object({
    path: z.string().min(1).max(300).refine(isSafeRelativePath),
    mimeType: z.enum(MIME_TYPES),
    sha256: z.string().regex(SHA256_PATTERN),
    bytes: z.number().int().positive().max(MAX_RELEASE_ASSET_BYTES),
    requiredOffline: z.boolean(),
  })
  .strict()
  .superRefine((asset, context) => {
    const fixedMime = FIXED_MIME.get(asset.path);
    const viteMatch = VITE_ASSET_PATTERN.exec(asset.path);
    const browserMime =
      fixedMime ??
      (viteMatch === null ? undefined : VITE_MIME.get(viteMatch[1]!));
    if (browserMime !== undefined) {
      if (asset.mimeType !== browserMime || !asset.requiredOffline) {
        context.addIssue({
          code: 'custom',
          message:
            'Browser assets require their fixed MIME and offline status.',
        });
      }
      return;
    }

    if (asset.mimeType.startsWith('audio/') && asset.requiredOffline) {
      context.addIssue({
        code: 'custom',
        path: ['requiredOffline'],
        message: 'Audio cannot be precached.',
      });
    }
    const validMimePath =
      (asset.mimeType === 'audio/mpeg' &&
        asset.path.startsWith('audio/') &&
        asset.path.endsWith('.mp3')) ||
      (asset.mimeType === 'audio/ogg' &&
        asset.path.startsWith('audio/') &&
        asset.path.endsWith('.ogg')) ||
      (asset.mimeType === 'font/woff2' &&
        asset.path.startsWith('fonts/') &&
        asset.path.endsWith('.woff2')) ||
      (asset.mimeType === 'image/svg+xml' &&
        asset.path.startsWith('icons/') &&
        asset.path.endsWith('.svg')) ||
      (asset.mimeType === 'image/avif' &&
        asset.path.startsWith('images/') &&
        asset.path.endsWith('.avif')) ||
      (asset.mimeType === 'image/webp' &&
        asset.path.startsWith('images/') &&
        asset.path.endsWith('.webp')) ||
      (asset.mimeType === 'image/png' &&
        asset.path.startsWith('images/') &&
        asset.path.endsWith('.png'));
    if (
      !validMimePath ||
      !(asset.path.split('/').at(-1) ?? '').includes(asset.sha256.slice(0, 8))
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Asset MIME, path, and digest relationship is invalid.',
      });
    }
  });

export const offlineAssetManifestSchema = z
  .object({
    releaseId: z.string().regex(ID_PATTERN),
    assets: z.array(offlineAssetSchema),
  })
  .strict()
  .superRefine((manifest, context) => {
    const paths = new Set<string>();
    manifest.assets.forEach((asset, index) => {
      if (paths.has(asset.path)) {
        context.addIssue({
          code: 'custom',
          path: ['assets', index, 'path'],
          message: 'Asset paths must be unique.',
        });
      }
      paths.add(asset.path);
    });
  });

export type OfflineReleaseDescriptor = z.infer<
  typeof offlineReleaseDescriptorSchema
>;
export type OfflineCorpus = z.infer<typeof offlineCorpusSchema>;
export type OfflineAssetManifest = z.infer<typeof offlineAssetManifestSchema>;
