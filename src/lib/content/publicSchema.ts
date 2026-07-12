import { z } from 'zod';

import {
  EXPERIENCE_MODES,
  POETS,
  TRANSLATION_CLASSIFICATIONS,
} from '../../contracts/content';
import { canonicalSha256 } from './canonical';

const VISUAL_VARIANTS = ['garden_night', 'lamp_constellation'] as const;
const ACCENTS = ['pomegranate', 'lapis'] as const;
const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/ogg'] as const;
const HTML_PATTERN = /<(?:!--|\/?[A-Za-z][^>]*>)/u;
const MARKDOWN_PATTERNS = [
  /(?:^|\n)\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s/u,
  /!?\[[^\]]*\]\([^)]*\)/u,
  /(?:\*\*|__|~~|`)/u,
];
const BIDI_CONTROL_PATTERN = /[\u202A-\u202E\u2066-\u2069]/u;
const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

function containsRawMarkup(value: string): boolean {
  return (
    HTML_PATTERN.test(value) ||
    MARKDOWN_PATTERNS.some((pattern) => pattern.test(value))
  );
}

function publicText(maximumLength: number) {
  return z
    .string()
    .min(1)
    .max(maximumLength)
    .refine((value) => value.trim().length > 0, 'Text cannot be blank.')
    .refine((value) => !containsRawMarkup(value), 'Raw HTML or Markdown is not allowed.')
    .refine(
      (value) => !BIDI_CONTROL_PATTERN.test(value),
      'Bidi control characters are not allowed in content fields.',
    );
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function isSafeAudioPath(value: string): boolean {
  if (
    !value.startsWith('audio/') ||
    value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.includes('?') ||
    value.includes('#') ||
    !/^[A-Za-z0-9._/-]+$/u.test(value)
  ) {
    return false;
  }

  const segments = value.split('/');
  return (
    segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..') &&
    /\.(?:mp3|ogg)$/u.test(value)
  );
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
    persianLines: z.array(publicText(500)).min(2).max(6),
    englishLines: z.array(publicText(500)).min(2).max(6),
    alignment: z.enum(['line', 'stanza']),
  })
  .strict()
  .superRefine((text, context) => {
    if (
      text.alignment === 'line' &&
      text.persianLines.length !== text.englishLines.length
    ) {
      context.addIssue({
        code: 'custom',
        path: ['englishLines'],
        message: 'Line-aligned Persian and English arrays must have equal lengths.',
      });
    }
  });

const audioSchema = z
  .object({
    assetPath: z
      .string()
      .max(300)
      .refine(isSafeAudioPath, 'Audio must use a safe local audio/ asset path.'),
    mimeType: z.enum(AUDIO_MIME_TYPES),
    durationSeconds: z.number().int().min(20).max(60),
    performerCredit: publicText(300),
  })
  .strict()
  .superRefine((audio, context) => {
    const expectedMime = audio.assetPath.endsWith('.mp3')
      ? 'audio/mpeg'
      : 'audio/ogg';
    if (audio.mimeType !== expectedMime) {
      context.addIssue({
        code: 'custom',
        path: ['mimeType'],
        message: 'Audio MIME type must match the local asset extension.',
      });
    }
  });

const publicContentPayloadObjectSchema = z
  .object({
    id: z.string().min(1).max(128).regex(IDENTIFIER_PATTERN),
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
    translationCredit: publicText(300),
    reflection: publicText(1_200).refine(
      (value) => {
        const count = wordCount(value);
        return count >= 45 && count <= 90;
      },
      'Reflections must contain between 45 and 90 words.',
    ),
    audio: audioSchema.nullable(),
  })
  .strict();

type PublicContentPayloadInput = z.infer<typeof publicContentPayloadObjectSchema>;

function addContentSemantics(
  item: PublicContentPayloadInput,
  addIssue: (path: readonly PropertyKey[], message: string) => void,
): void {
  const validMode =
    (item.poet === 'hafez' && item.mode === 'open_the_divan') ||
    (item.poet === 'rumi' && item.mode === 'moment_of_reflection');
  if (!validMode) {
    addIssue(['mode'], 'Poet and experience mode do not form an approved pairing.');
  }

  if (
    item.poet === 'hafez' &&
    (item.source.openingHemistichFa === null ||
      item.source.openingHemistichFa.trim().length === 0)
  ) {
    addIssue(
      ['source', 'openingHemistichFa'],
      'Hafez items require a reviewed opening hemistich.',
    );
  }
}

export const publicContentPayloadSchema = publicContentPayloadObjectSchema.superRefine(
  (item, context) => {
    addContentSemantics(item, (path, message) => {
      context.addIssue({ code: 'custom', path: [...path], message });
    });
  },
);

const publicContentItemObjectSchema = publicContentPayloadObjectSchema.extend({
  contentHash: z.string().regex(SHA256_PATTERN, 'Use a lowercase SHA-256 digest.'),
});

export const publicContentItemSchema = publicContentItemObjectSchema.superRefine(
  (item, context) => {
    addContentSemantics(item, (path, message) => {
      context.addIssue({ code: 'custom', path: [...path], message });
    });

    const payload = {
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
    if (canonicalSha256(payload) !== item.contentHash) {
      context.addIssue({
        code: 'custom',
        path: ['contentHash'],
        message: 'Content hash does not match the canonical public item.',
      });
    }
  },
);

export type PublicContentPayload = z.infer<typeof publicContentPayloadSchema>;
export type ValidatedPublicContentItem = z.infer<typeof publicContentItemSchema>;
