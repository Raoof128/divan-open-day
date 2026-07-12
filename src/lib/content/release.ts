import { z } from 'zod';

import type { PublicContentItem } from '../../contracts/content';
import type {
  AssetManifest,
  BuildProfile,
  ReleaseAsset,
  ReleaseDescriptor,
} from '../../contracts/release';
import { canonicalSha256, canonicalStringify } from './canonical';
import type { CompiledCorpus } from './compileCorpus';
import { publicContentItemSchema } from './publicSchema';

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const RELEASE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SAFE_ASSET_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/u;

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
    .every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

const releaseAssetSchema = z
  .object({
    path: z.string().min(1).max(300).refine(isSafeLocalAssetPath, {
      message: 'Asset paths must be safe local paths.',
    }),
    sha256: z.string().regex(SHA256_PATTERN),
    bytes: z.number().int().nonnegative(),
    requiredOffline: z.boolean(),
  })
  .strict()
  .superRefine((asset, context) => {
    const filename = asset.path.split('/').at(-1) ?? '';
    if (!filename.includes(asset.sha256.slice(0, 8))) {
      context.addIssue({
        code: 'custom',
        path: ['path'],
        message: 'Published asset filenames must be content-addressed by SHA-256.',
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
  readonly assets: readonly ReleaseAsset[];
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
  readonly files: ReadonlyMap<string, string>;
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
  const assets = input.assets
    .map((asset) => releaseAssetSchema.parse(asset))
    .toSorted((left, right) => compareCodeUnits(left.path, right.path));
  const assetManifest: AssetManifest = assetManifestSchema.parse({
    releaseId: input.releaseId,
    assets,
  });

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
    files: new Map([
      ['release.json', releaseJson],
      [release.contentPath.slice(1), contentJson],
      [release.assetManifestPath.slice(1), assetManifestJson],
    ]),
  };
}
