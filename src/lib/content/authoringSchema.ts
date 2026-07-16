import { z } from 'zod';

import {
  EXPERIENCE_MODES,
  POETS,
  TRANSLATION_CLASSIFICATIONS,
} from '../../contracts/content';
import { reviewAuthoritySchema } from './reviewAuthority';

const VISUAL_VARIANTS = ['garden_night', 'lamp_constellation'] as const;
const ACCENTS = ['pomegranate', 'lapis'] as const;
const REFERENCE_TYPES = ['ghazal', 'masnavi', 'rubai'] as const;
const AUTHORING_STATUSES = ['draft', 'approved', 'disabled'] as const;
const PERMITTED_USES = [
  'website_display',
  'downloadable_share_card',
  'event_print',
  'archival_hosting',
] as const;
const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/ogg'] as const;

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
const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

function containsRawMarkup(value: string): boolean {
  return (
    HTML_PATTERN.test(value) ||
    MARKDOWN_PATTERNS.some((pattern) => pattern.test(value))
  );
}

function reviewedText(maximumLength: number) {
  return z
    .string()
    .min(1)
    .max(maximumLength)
    .refine((value) => value.trim().length > 0, 'Text cannot be blank.')
    .refine(
      (value) => !containsRawMarkup(value),
      'Raw HTML or Markdown is not allowed.',
    )
    .refine(
      (value) => !BIDI_CONTROL_PATTERN.test(value),
      'Bidi control characters are not allowed in content fields.',
    );
}

const identifierSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(IDENTIFIER_PATTERN, 'Identifiers must use lowercase kebab-case.');

const identifierListSchema = z.array(identifierSchema).min(1).max(20);
const sha256Schema = z.string().regex(SHA256_PATTERN);

function wordCount(value: string): number {
  return value.match(WORD_LIKE_PATTERN)?.length ?? 0;
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
    segments.every(
      (segment) => segment.length > 0 && segment !== '.' && segment !== '..',
    ) && /\.(?:mp3|ogg)$/u.test(value)
  );
}

const displaySchema = z
  .object({
    visual_variant: z.enum(VISUAL_VARIANTS),
    accent: z.enum(ACCENTS),
  })
  .strict();

const sourceSchema = z
  .object({
    work_en: reviewedText(200),
    work_fa: reviewedText(200),
    edition_id: identifierSchema,
    edition_citation: reviewedText(1_000),
    edition_public_credit: reviewedText(500),
    reference_type: z.enum(REFERENCE_TYPES),
    reference_value: reviewedText(200),
    opening_hemistich_fa: reviewedText(500).nullable(),
    page_reference: reviewedText(100).nullable().optional(),
    source_language: z.literal('fa'),
    english_source_id: identifierSchema,
    english_source_sha256: sha256Schema,
    english_source_reference: reviewedText(300),
    persian_source_sha256: sha256Schema,
  })
  .strict();

const textSchema = z
  .object({
    persian_lines: z.array(reviewedText(500)).min(1).max(6),
    english_lines: z.array(reviewedText(500)).min(1).max(6),
    alignment: z.enum(['line', 'stanza']),
    mapping: z
      .array(
        z
          .object({
            english_index: z.number().int().min(0).max(5),
            persian_indices: z
              .array(z.number().int().min(0).max(5))
              .min(1)
              .max(6),
          })
          .strict(),
      )
      .min(1)
      .max(6),
  })
  .strict()
  .superRefine((text, context) => {
    const mappedEnglish = new Set<number>();
    for (const [mappingIndex, mapping] of text.mapping.entries()) {
      if (
        mapping.english_index >= text.english_lines.length ||
        mapping.persian_indices.some(
          (persianIndex) => persianIndex >= text.persian_lines.length,
        )
      ) {
        context.addIssue({
          code: 'custom',
          path: ['mapping', mappingIndex],
          message:
            'Line mapping index falls outside the selected source spans.',
        });
      }
      if (mappedEnglish.has(mapping.english_index)) {
        context.addIssue({
          code: 'custom',
          path: ['mapping', mappingIndex, 'english_index'],
          message: 'Each selected English unit must have one mapping entry.',
        });
      }
      mappedEnglish.add(mapping.english_index);
    }
    if (mappedEnglish.size !== text.english_lines.length) {
      context.addIssue({
        code: 'custom',
        path: ['mapping'],
        message: 'Every selected English unit must be mapped.',
      });
    }
  });

const translationSchema = z
  .object({
    classification: z.enum(TRANSLATION_CLASSIFICATIONS),
    translator_ids: z.array(identifierSchema).max(20),
    rights_owner: reviewedText(300),
    permission_record_id: identifierSchema,
    public_credit: reviewedText(300),
    permitted_uses: z
      .array(z.enum(PERMITTED_USES))
      .min(1)
      .max(PERMITTED_USES.length),
    moral_rights_notes: reviewedText(1_000).nullable().optional(),
  })
  .strict()
  .superRefine((translation, context) => {
    const uniqueUses = new Set(translation.permitted_uses);
    for (const requiredUse of PERMITTED_USES) {
      if (!uniqueUses.has(requiredUse)) {
        context.addIssue({
          code: 'custom',
          path: ['permitted_uses'],
          message: `Missing required permitted use: ${requiredUse}.`,
        });
      }
    }

    if (uniqueUses.size !== translation.permitted_uses.length) {
      context.addIssue({
        code: 'custom',
        path: ['permitted_uses'],
        message: 'Permitted uses cannot contain duplicates.',
      });
    }
  });

const reflectionSchema = z
  .object({
    english: reviewedText(1_200).refine((value) => {
      const count = wordCount(value);
      return count >= 45 && count <= 90;
    }, 'Reflections must contain between 45 and 90 words.'),
    reviewer_ids: identifierListSchema,
    disclaimer_profile: z.literal('reflection_not_prediction'),
  })
  .strict();

const disabledAudioSchema = z
  .object({
    enabled: z.literal(false),
    asset_path: z.null(),
    mime_type: z.null(),
    performer_id: z.null(),
    performer_public_credit: z.null(),
    permission_record_id: z.null(),
    duration_seconds: z.null(),
  })
  .strict();

const enabledAudioSchema = z
  .object({
    enabled: z.literal(true),
    asset_path: z
      .string()
      .max(300)
      .refine(
        isSafeAudioPath,
        'Audio must use a safe local audio/ asset path.',
      ),
    mime_type: z.enum(AUDIO_MIME_TYPES),
    performer_id: identifierSchema,
    performer_public_credit: reviewedText(300),
    permission_record_id: identifierSchema,
    duration_seconds: z.number().int().min(20).max(60),
  })
  .strict()
  .superRefine((audio, context) => {
    const expectedMime = audio.asset_path.endsWith('.mp3')
      ? 'audio/mpeg'
      : 'audio/ogg';
    if (audio.mime_type !== expectedMime) {
      context.addIssue({
        code: 'custom',
        path: ['mime_type'],
        message: 'Audio MIME type must match the local asset extension.',
      });
    }
  });

const reviewSchema = z
  .object({
    source_editor_ids: identifierListSchema,
    persian_literary_reviewer_ids: identifierListSchema,
    english_editor_ids: identifierListSchema,
    cultural_reviewer_ids: identifierListSchema,
    rights_reviewer_ids: identifierListSchema,
    approved_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/u, 'Use an ISO calendar date.')
      .refine((value) => {
        const parsed = new Date(`${value}T00:00:00.000Z`);
        return (
          !Number.isNaN(parsed.valueOf()) &&
          parsed.toISOString().slice(0, 10) === value
        );
      }, 'Approval date must be a real calendar date.'),
    approval_record_id: identifierSchema,
  })
  .strict();

export const authoringContentItemSchema = z
  .object({
    id: identifierSchema,
    schema_version: z.literal(2),
    status: z.enum(AUTHORING_STATUSES),
    poet: z.enum(POETS),
    mode: z.enum(EXPERIENCE_MODES),
    display: displaySchema,
    source: sourceSchema,
    text: textSchema,
    translation: translationSchema,
    reflection: reflectionSchema.nullable(),
    audio: z.discriminatedUnion('enabled', [
      disabledAudioSchema,
      enabledAudioSchema,
    ]),
    review: reviewSchema.nullable(),
    review_authority: reviewAuthoritySchema,
  })
  .strict()
  .superRefine((item, context) => {
    const validMode =
      (item.poet === 'hafez' && item.mode === 'open_the_divan') ||
      (item.poet === 'rumi' && item.mode === 'moment_of_reflection');
    if (!validMode) {
      context.addIssue({
        code: 'custom',
        path: ['mode'],
        message: 'Poet and experience mode do not form an approved pairing.',
      });
    }

    if (
      item.poet === 'hafez' &&
      (item.source.opening_hemistich_fa === null ||
        item.source.opening_hemistich_fa.trim().length === 0)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['source', 'opening_hemistich_fa'],
        message: 'Hafez items require a reviewed opening hemistich.',
      });
    }

    if (item.review_authority.kind === 'human') {
      if (item.reflection === null || item.review === null) {
        context.addIssue({
          code: 'custom',
          path: ['review_authority'],
          message:
            'Human authority requires the legacy review and reflection evidence.',
        });
        return;
      }
      if (item.translation.translator_ids.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['translation', 'translator_ids'],
          message: 'Human authority requires a credited translator identity.',
        });
      }

      const translatorIds = new Set(item.translation.translator_ids);
      const accountableReviewers = [
        ...item.reflection.reviewer_ids,
        ...item.review.source_editor_ids,
        ...item.review.persian_literary_reviewer_ids,
        ...item.review.english_editor_ids,
        ...item.review.cultural_reviewer_ids,
        ...item.review.rights_reviewer_ids,
      ];
      if (
        !accountableReviewers.some(
          (reviewerId) => !translatorIds.has(reviewerId),
        )
      ) {
        context.addIssue({
          code: 'custom',
          path: ['review'],
          message: 'An item cannot be approved only by its translator.',
        });
      }
    }
  });

export type AuthoringContentItem = z.infer<typeof authoringContentItemSchema>;
