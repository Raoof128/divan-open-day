import { createHash } from 'node:crypto';

import { z } from 'zod';

import type { PublicContentItem } from '../../contracts/content';
import type {
  AssetManifest,
  BuildProfile,
  ReleaseAsset,
  ReleaseDescriptor,
} from '../../contracts/release';
import { MAX_RELEASE_ASSET_BYTES } from '../../contracts/release';
import { canonicalSha256, canonicalStringify } from './canonical';
import type { CompiledCorpus } from './compileCorpus';
import { publicContentItemSchema } from './publicSchema';

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const RELEASE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SAFE_ASSET_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/u;
const ASSET_MIME_TYPES = [
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

const FIXED_BROWSER_ASSETS = new Map<string, (typeof ASSET_MIME_TYPES)[number]>([
  ['index.html', 'text/html'],
  ['manifest.webmanifest', 'application/manifest+json'],
  ['offline.html', 'text/html'],
  ['service-worker.js', 'text/javascript'],
]);

const VITE_ASSET_PATTERN =
  /^assets\/[A-Za-z0-9][A-Za-z0-9._-]*-[a-f0-9]{16}\.(css|js|woff2|avif|png|svg|webp)$/u;

const VITE_MIME_BY_EXTENSION = new Map<
  string,
  (typeof ASSET_MIME_TYPES)[number]
>([
  ['avif', 'image/avif'],
  ['css', 'text/css'],
  ['js', 'text/javascript'],
  ['png', 'image/png'],
  ['svg', 'image/svg+xml'],
  ['webp', 'image/webp'],
  ['woff2', 'font/woff2'],
]);

export function browserAssetMimeType(
  assetPath: string,
): (typeof ASSET_MIME_TYPES)[number] | null {
  const fixed = FIXED_BROWSER_ASSETS.get(assetPath);
  if (fixed !== undefined) {
    return fixed;
  }
  const match = VITE_ASSET_PATTERN.exec(assetPath);
  return match === null ? null : (VITE_MIME_BY_EXTENSION.get(match[1]!) ?? null);
}

function isSafeLocalAssetPath(value: string): boolean {
  if (
    value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.includes('?') ||
    value.includes('#') ||
    !SAFE_ASSET_PATH_PATTERN.test(value)
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

const releaseAssetSchema = z
  .object({
    path: z.string().min(1).max(300).refine(isSafeLocalAssetPath, {
      message: 'Asset paths must be safe local paths.',
    }),
    mimeType: z.enum(ASSET_MIME_TYPES),
    sha256: z.string().regex(SHA256_PATTERN),
    bytes: z.number().int().positive().max(MAX_RELEASE_ASSET_BYTES),
    requiredOffline: z.boolean(),
  })
  .strict()
  .superRefine((asset, context) => {
    const browserMimeType = browserAssetMimeType(asset.path);
    if (browserMimeType !== null) {
      if (asset.mimeType !== browserMimeType) {
        context.addIssue({
          code: 'custom',
          path: ['mimeType'],
          message: 'Browser asset MIME type must match its fixed or Vite path.',
        });
      }
      if (!asset.requiredOffline) {
        context.addIssue({
          code: 'custom',
          path: ['requiredOffline'],
          message: 'Browser shell assets must be required for offline staging.',
        });
      }
      return;
    }

    const filename = asset.path.split('/').at(-1) ?? '';
    if (!filename.includes(asset.sha256.slice(0, 8))) {
      context.addIssue({
        code: 'custom',
        path: ['path'],
        message: 'Published asset filenames must be content-addressed by SHA-256.',
      });
    }

    const validMimePath =
      (asset.mimeType === 'audio/mpeg' && asset.path.startsWith('audio/') && asset.path.endsWith('.mp3')) ||
      (asset.mimeType === 'audio/ogg' && asset.path.startsWith('audio/') && asset.path.endsWith('.ogg')) ||
      (asset.mimeType === 'font/woff2' && asset.path.startsWith('fonts/') && asset.path.endsWith('.woff2')) ||
      (asset.mimeType === 'image/svg+xml' && asset.path.startsWith('icons/') && asset.path.endsWith('.svg')) ||
      (asset.mimeType === 'image/avif' && asset.path.startsWith('images/') && asset.path.endsWith('.avif')) ||
      (asset.mimeType === 'image/webp' && asset.path.startsWith('images/') && asset.path.endsWith('.webp')) ||
      (asset.mimeType === 'image/png' && asset.path.startsWith('images/') && asset.path.endsWith('.png'));
    if (!validMimePath) {
      context.addIssue({
        code: 'custom',
        path: ['mimeType'],
        message: 'Release asset MIME type must match its approved path and extension.',
      });
    }
  });

export const assetManifestSchema = z
  .object({
    releaseId: z.string().regex(RELEASE_ID_PATTERN),
    assets: z.array(releaseAssetSchema),
  })
  .strict()
  .superRefine((manifest, context) => {
    const paths = new Set<string>();
    manifest.assets.forEach((asset, index) => {
      if (paths.has(asset.path)) {
        context.addIssue({
          code: 'custom',
          path: ['assets', index, 'path'],
          message: `Duplicate release asset path ${asset.path}.`,
        });
      }
      paths.add(asset.path);
    });
    for (const fixedPath of FIXED_BROWSER_ASSETS.keys()) {
      if (manifest.assets.filter((asset) => asset.path === fixedPath).length !== 1) {
        context.addIssue({
          code: 'custom',
          path: ['assets'],
          message: `Release manifest requires exactly one ${fixedPath}.`,
        });
      }
    }
  });

export const publicCorpusSchema = z
  .object({
    schemaVersion: z.literal(2),
    releaseId: z.string().regex(RELEASE_ID_PATTERN),
    items: z.array(publicContentItemSchema),
  })
  .strict()
  .superRefine((corpus, context) => {
    const ids = new Set<string>();
    corpus.items.forEach((item, index) => {
      if (ids.has(item.id)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'id'],
          message: `Duplicate public content ID ${item.id}.`,
        });
      }
      ids.add(item.id);
    });
  });

export const releaseDescriptorSchema = z
  .object({
    releaseId: z.string().regex(RELEASE_ID_PATTERN),
    schemaVersion: z.literal(2),
    builtAt: z
      .string()
      .datetime({ offset: true })
      .refine(
        (value) => new Date(value).toISOString() === value,
        'builtAt must be a canonical UTC timestamp.',
      ),
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
        message: 'Release poet counts must add up to the total item count.',
      });
    }
    if (release.productionEligible !== (release.buildProfile === 'production')) {
      context.addIssue({
        code: 'custom',
        path: ['productionEligible'],
        message: 'Release eligibility must match its build profile.',
      });
    }
    if (release.contentPath !== `/content/${release.contentSha256}.json`) {
      context.addIssue({
        code: 'custom',
        path: ['contentPath'],
        message: 'Release content path must match its SHA-256.',
      });
    }
    if (
      release.assetManifestPath !==
      `/assets/${release.assetManifestSha256}.json`
    ) {
      context.addIssue({
        code: 'custom',
        path: ['assetManifestPath'],
        message: 'Release asset manifest path must match its SHA-256.',
      });
    }
  });

export interface CreateReleaseArtifactsInput {
  readonly profile: BuildProfile;
  readonly releaseId: string;
  readonly builtAt: string;
  readonly corpus: CompiledCorpus;
  readonly assets: readonly ReleaseAssetSource[];
}

export interface ReleaseAssetSource extends ReleaseAsset {
  readonly contents: Uint8Array;
}

export interface PublicCorpus {
  readonly schemaVersion: 2;
  readonly releaseId: string;
  readonly items: readonly PublicContentItem[];
}

export interface ReleaseArtifacts {
  readonly release: ReleaseDescriptor;
  readonly corpus: PublicCorpus;
  readonly assetManifest: AssetManifest;
  readonly contentJson: string;
  readonly assetManifestJson: string;
  readonly releaseJson: string;
  readonly files: ReadonlyMap<string, string | Uint8Array>;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function parseCanonicalUtcTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) {
    throw new Error('builtAt must be a canonical UTC timestamp.');
  }
  return value;
}

export function createReleaseArtifacts(
  input: CreateReleaseArtifactsInput,
): ReleaseArtifacts {
  if (!RELEASE_ID_PATTERN.test(input.releaseId)) {
    throw new Error('Release ID must use lowercase kebab-case.');
  }
  const builtAt = parseCanonicalUtcTimestamp(input.builtAt);
  if (input.corpus.productionEligible !== (input.profile === 'production')) {
    throw new Error('Compiled corpus eligibility must match the release profile.');
  }

  const corpus: PublicCorpus = publicCorpusSchema.parse({
    schemaVersion: 2,
    releaseId: input.releaseId,
    items: input.corpus.items,
  });
  const assetSources = input.assets
    .map((source) => {
      const asset = releaseAssetSchema.parse({
        path: source.path,
        mimeType: source.mimeType,
        sha256: source.sha256,
        bytes: source.bytes,
        requiredOffline: source.requiredOffline,
      });
      if (source.contents.byteLength !== asset.bytes) {
        throw new Error(`Release asset byte count mismatch for ${asset.path}.`);
      }
      const digest = createHash('sha256').update(source.contents).digest('hex');
      if (digest !== asset.sha256) {
        throw new Error(`Release asset SHA-256 mismatch for ${asset.path}.`);
      }
      return { asset, contents: source.contents.slice() };
    })
    .toSorted((left, right) => compareCodeUnits(left.asset.path, right.asset.path));
  const assets = assetSources.map((source) => source.asset);
  const assetManifest: AssetManifest = assetManifestSchema.parse({
    releaseId: input.releaseId,
    assets,
  });

  const publicAudioByPath = new Map<string, string>();
  for (const item of corpus.items) {
    if (item.audio === null) {
      continue;
    }
    const previousMime = publicAudioByPath.get(item.audio.assetPath);
    if (previousMime !== undefined && previousMime !== item.audio.mimeType) {
      throw new Error(`Compiled audio path ${item.audio.assetPath} has conflicting MIME types.`);
    }
    publicAudioByPath.set(item.audio.assetPath, item.audio.mimeType);
  }
  for (const [audioPath, mimeType] of publicAudioByPath) {
    const candidates = assets.filter((asset) => asset.path === audioPath);
    if (candidates.length !== 1 || candidates[0]?.mimeType !== mimeType) {
      throw new Error(
        `Compiled audio ${audioPath} must have exactly one matching manifest asset and file.`,
      );
    }
  }
  for (const asset of assets) {
    if (asset.mimeType.startsWith('audio/') && !publicAudioByPath.has(asset.path)) {
      throw new Error(`Orphan audio manifest asset ${asset.path} is not referenced by the corpus.`);
    }
  }

  const contentJson = canonicalStringify(corpus);
  const assetManifestJson = canonicalStringify(assetManifest);
  const contentSha256 = canonicalSha256(corpus);
  const assetManifestSha256 = canonicalSha256(assetManifest);
  const release: ReleaseDescriptor = releaseDescriptorSchema.parse({
    releaseId: input.releaseId,
    schemaVersion: 2,
    builtAt,
    buildProfile: input.profile,
    productionEligible: input.profile === 'production',
    itemCount: input.corpus.totalCount,
    hafezCount: input.corpus.hafezCount,
    rumiCount: input.corpus.rumiCount,
    contentPath: `/content/${contentSha256}.json`,
    contentSha256,
    assetManifestPath: `/assets/${assetManifestSha256}.json`,
    assetManifestSha256,
  });
  const releaseJson = canonicalStringify(release);

  return {
    release,
    corpus,
    assetManifest,
    contentJson,
    assetManifestJson,
    releaseJson,
    files: new Map<string, string | Uint8Array>([
      ['release.json', releaseJson],
      [release.contentPath.slice(1), contentJson],
      [release.assetManifestPath.slice(1), assetManifestJson],
      ...assetSources.map(
        (asset) => [asset.asset.path, asset.contents] as const,
      ),
    ]),
  };
}
