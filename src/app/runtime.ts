import { z } from 'zod';

import type { PublicContentItem } from '../contracts/content';
import {
  EXPERIENCE_MODES,
  POETS,
  TRANSLATION_CLASSIFICATIONS,
} from '../contracts/content';
import type { ReleaseDescriptor } from '../contracts/release';

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const PUBLIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const VISUAL_VARIANTS = ['garden_night', 'lamp_constellation'] as const;
const ACCENTS = ['pomegranate', 'lapis'] as const;
const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/ogg'] as const;
const HTML_PATTERN = /<(?:!--|![A-Za-z]|!\[|\?|\/?[A-Za-z][^>]*>)/u;
const MARKDOWN_PATTERNS = [
  /(?:^|\n)(?:\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s|(?: {4}| {0,3}\t)\S)/u,
  /!?\[[^\]]*\]\([^)]*\)/u,
  /(?:^|\n)\s{0,3}(?:`{3,}|~{3,})/u,
  /(?:\*\*|__|~~|`)/u,
];
const BIDI_CONTROL_PATTERN = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
const WORD_LIKE_PATTERN =
  /[\p{L}\p{N}][\p{L}\p{N}\p{M}\u200C\u200D]*(?:['’.-][\p{L}\p{N}][\p{L}\p{N}\p{M}\u200C\u200D]*)*/gu;

export const RELEASE_ERROR_MESSAGE =
  'The current poetry collection is being prepared. Please try again shortly or visit us at the stall.';

export class ReleaseLoadError extends Error {
  public readonly code = 'release_unavailable' as const;

  public constructor() {
    super(RELEASE_ERROR_MESSAGE);
    this.name = 'ReleaseLoadError';
  }
}

const releaseDescriptorSchema = z
  .object({
    releaseId: z.string().regex(PUBLIC_ID_PATTERN),
    schemaVersion: z.literal(2),
    builtAt: z
      .string()
      .datetime({ offset: true })
      .refine(
        (value) => new Date(value).toISOString() === value,
        'Use a canonical UTC build timestamp.',
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
        message: 'Poet counts must add up to the release total.',
      });
    }
    if (release.productionEligible !== (release.buildProfile === 'production')) {
      context.addIssue({
        code: 'custom',
        path: ['productionEligible'],
        message: 'Release eligibility must match the build profile.',
      });
    }
    if (release.contentPath !== `/content/${release.contentSha256}.json`) {
      context.addIssue({
        code: 'custom',
        path: ['contentPath'],
        message: 'Content path must match the declared digest.',
      });
    }
    if (
      release.assetManifestPath !==
      `/assets/${release.assetManifestSha256}.json`
    ) {
      context.addIssue({
        code: 'custom',
        path: ['assetManifestPath'],
        message: 'Asset-manifest path must match the declared digest.',
      });
    }
  });

function nonBlankText(maximumLength: number) {
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

function wordCount(value: string): number {
  return value.match(WORD_LIKE_PATTERN)?.length ?? 0;
}

const sourceSchema = z
  .object({
    workEn: nonBlankText(200),
    workFa: nonBlankText(200),
    editionPublicCredit: nonBlankText(500),
    reference: nonBlankText(200),
    openingHemistichFa: nonBlankText(500).nullable(),
  })
  .strict();

const textSchema = z
  .object({
    persianLines: z.array(nonBlankText(500)).min(2).max(6),
    englishLines: z.array(nonBlankText(500)).min(2).max(6),
    alignment: z.enum(['line', 'stanza']),
  })
  .strict()
  .superRefine((text, context) => {
    if (text.persianLines.length !== text.englishLines.length) {
      context.addIssue({
        code: 'custom',
        path: ['englishLines'],
        message: 'English and Persian units must remain aligned.',
      });
    }
  });

const audioSchema = z
  .object({
    assetPath: z.string().regex(/^audio\/[A-Za-z0-9._/-]+\.(?:mp3|ogg)$/u),
    mimeType: z.enum(AUDIO_MIME_TYPES),
    durationSeconds: z.number().int().min(20).max(60),
    performerCredit: nonBlankText(300),
  })
  .strict()
  .superRefine((audio, context) => {
    const expectedMime = audio.assetPath.endsWith('.mp3')
      ? 'audio/mpeg'
      : 'audio/ogg';
    if (
      audio.assetPath.includes('/../') ||
      audio.assetPath.includes('/./') ||
      audio.mimeType !== expectedMime
    ) {
      context.addIssue({
        code: 'custom',
        path: ['assetPath'],
        message: 'Audio must be a matching safe local release asset.',
      });
    }
  });

const contentItemSchema = z
  .object({
    id: z.string().max(128).regex(PUBLIC_ID_PATTERN),
    schemaVersion: z.literal(2),
    poet: z.enum(POETS),
    mode: z.enum(EXPERIENCE_MODES),
    display: z
      .object({
        visualVariant: z.enum(VISUAL_VARIANTS),
        accent: z.enum(ACCENTS),
      })
      .strict(),
    source: sourceSchema,
    text: textSchema,
    translationClassification: z.enum(TRANSLATION_CLASSIFICATIONS),
    translationCredit: nonBlankText(300),
    reflection: nonBlankText(1_200).refine(
      (value) => {
        const count = wordCount(value);
        return count >= 45 && count <= 90;
      },
      'Reflections must contain between 45 and 90 words.',
    ),
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

const publicCorpusSchema = z
  .object({
    schemaVersion: z.literal(2),
    releaseId: z.string().regex(PUBLIC_ID_PATTERN),
    items: z.array(contentItemSchema),
  })
  .strict()
  .superRefine((corpus, context) => {
    const ids = new Set<string>();
    corpus.items.forEach((item, index) => {
      if (ids.has(item.id)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'id'],
          message: 'Public content IDs must be unique.',
        });
      }
      ids.add(item.id);
    });
  });

interface RuntimeCrypto {
  readonly subtle: Pick<SubtleCrypto, 'digest'>;
  readonly getRandomValues?: unknown;
}

export interface RuntimeOptions {
  readonly fetch?: typeof fetch;
  readonly crypto?: RuntimeCrypto | null;
}

export interface PublicCorpus {
  readonly schemaVersion: 2;
  readonly releaseId: string;
  readonly items: readonly PublicContentItem[];
}

export interface VerifiedRelease {
  readonly descriptor: ReleaseDescriptor;
  readonly corpus: PublicCorpus;
  readonly itemsById: ReadonlyMap<string, PublicContentItem>;
}

function canonicalStringify(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Non-finite numbers are not canonical JSON.');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalStringify(entry)).join(',')}]`;
  }
  if (typeof value !== 'object') {
    throw new TypeError('Unsupported canonical JSON value.');
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`,
    )
    .join(',')}}`;
}

function itemPayload(item: PublicContentItem): Omit<PublicContentItem, 'contentHash'> {
  return {
    id: item.id,
    schemaVersion: item.schemaVersion,
    poet: item.poet,
    mode: item.mode,
    display: item.display,
    source: item.source,
    text: item.text,
    translationClassification: item.translationClassification,
    translationCredit: item.translationCredit,
    reflection: item.reflection,
    audio: item.audio,
  };
}

function toHex(value: ArrayBuffer): string {
  return [...new Uint8Array(value)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(
  value: ArrayBuffer | Uint8Array,
  crypto: RuntimeCrypto,
): Promise<string> {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  const digestInput = bytes.slice().buffer;
  return toHex(await crypto.subtle.digest('SHA-256', digestInput));
}

async function fetchRequired(
  fetchImplementation: typeof fetch,
  path: string,
): Promise<Response> {
  const response = await fetchImplementation(path, {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { accept: 'application/json' },
    redirect: 'error',
  });
  if (!response.ok) {
    throw new ReleaseLoadError();
  }
  return response;
}

async function verifyItemHashes(
  items: readonly PublicContentItem[],
  crypto: RuntimeCrypto,
): Promise<void> {
  const hashes = await Promise.all(
    items.map((item) =>
      sha256(new TextEncoder().encode(canonicalStringify(itemPayload(item))), crypto),
    ),
  );
  if (items.some((item, index) => item.contentHash !== hashes[index])) {
    throw new ReleaseLoadError();
  }
}

export async function loadVerifiedRelease(
  options: RuntimeOptions = {},
): Promise<VerifiedRelease> {
  try {
    const fetchImplementation = options.fetch ?? globalThis.fetch;
    const runtimeCrypto =
      options.crypto === undefined ? globalThis.crypto : options.crypto;
    if (
      typeof fetchImplementation !== 'function' ||
      runtimeCrypto === null ||
      typeof runtimeCrypto.subtle?.digest !== 'function' ||
      typeof runtimeCrypto.getRandomValues !== 'function'
    ) {
      throw new ReleaseLoadError();
    }

    const releaseResponse = await fetchRequired(
      fetchImplementation,
      '/release.json',
    );
    const release: ReleaseDescriptor = releaseDescriptorSchema.parse(
      JSON.parse(await releaseResponse.text()) as unknown,
    );
    const corpusResponse = await fetchRequired(
      fetchImplementation,
      release.contentPath,
    );
    const corpusBuffer = await corpusResponse.arrayBuffer();
    if ((await sha256(corpusBuffer, runtimeCrypto)) !== release.contentSha256) {
      throw new ReleaseLoadError();
    }
    const corpus: PublicCorpus = publicCorpusSchema.parse(
      JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(corpusBuffer)) as unknown,
    );
    const hafezCount = corpus.items.filter((item) => item.poet === 'hafez').length;
    const rumiCount = corpus.items.length - hafezCount;
    if (
      corpus.releaseId !== release.releaseId ||
      corpus.items.length !== release.itemCount ||
      hafezCount !== release.hafezCount ||
      rumiCount !== release.rumiCount
    ) {
      throw new ReleaseLoadError();
    }
    await verifyItemHashes(corpus.items, runtimeCrypto);

    return {
      descriptor: release,
      corpus,
      itemsById: new Map(corpus.items.map((item) => [item.id, item])),
    };
  } catch {
    throw new ReleaseLoadError();
  }
}
