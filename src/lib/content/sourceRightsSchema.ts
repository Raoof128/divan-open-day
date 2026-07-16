import { z } from 'zod';

import { POETS } from '../../contracts/content';
import {
  isAllowlistedHttpsUrl,
  SOURCE_EDITION_IDS,
} from './sourceRegistrySchema';

/**
 * Source-level rights *evidence*. This records what the archival hosts state
 * about each edition (public-domain / CC BY-SA), the required public credit, and
 * a review lifecycle. It is deliberately NOT an approval: a record can only reach
 * `approved` once an accountable human rights reviewer is named AND the artifact
 * has actually been acquired (a real source-lock SHA-256). "ai" is never a valid
 * reviewer. Until then everything stays `pending` and production stays fail-closed.
 */
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const REVIEWER_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const nonBlankText = (maximumLength: number) =>
  z
    .string()
    .min(1)
    .max(maximumLength)
    .refine((value) => value.trim().length > 0, 'Text cannot be blank.');

const reviewerIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(REVIEWER_ID_PATTERN, 'Reviewer ids must be lowercase kebab-case.')
  .refine(
    (value) => value !== 'ai' && !value.startsWith('ai-') && value !== 'claude',
    'An AI is never a valid rights reviewer.',
  );

const sourceRightsRecordSchema = z
  .object({
    source_id: z.enum(SOURCE_EDITION_IDS),
    poet: z.enum(POETS),
    language: z.enum(['fa', 'en']).optional(),
    work_title: nonBlankText(200),
    contributor: nonBlankText(200),
    publication_year: z.number().int().min(600).max(2100).nullable(),
    completeness: z.enum(['complete', 'selection', 'abridged']),
    original_status: nonBlankText(600),
    transcription_licence: nonBlankText(300),
    evidence_url: z
      .string()
      .max(2_000)
      .refine(isAllowlistedHttpsUrl, 'Evidence URL must be allowlisted HTTPS.'),
    required_public_credit: nonBlankText(500),
    source_lock_reference: z
      .string()
      .regex(
        SHA256_PATTERN,
        'Source-lock reference must be a SHA-256 hex digest.',
      )
      .nullable(),
    rights_reviewer_id: reviewerIdSchema.nullable(),
    status: z.enum(['pending', 'approved', 'rejected']),
  })
  .strict()
  .superRefine((record, context) => {
    if (record.status === 'approved') {
      if (record.rights_reviewer_id === null) {
        context.addIssue({
          code: 'custom',
          path: ['rights_reviewer_id'],
          message:
            'An approved rights record requires a named human rights reviewer.',
        });
      }
      if (record.source_lock_reference === null) {
        context.addIssue({
          code: 'custom',
          path: ['source_lock_reference'],
          message:
            'An approved rights record requires the acquired source-lock SHA-256.',
        });
      }
    }
  });

export type SourceRightsRecord = z.infer<typeof sourceRightsRecordSchema>;

export const sourceRightsEvidenceSchema = z
  .object({
    schema_version: z.literal(1),
    records: z.array(sourceRightsRecordSchema),
  })
  .strict()
  .superRefine((evidence, context) => {
    const seen = new Set<string>();
    evidence.records.forEach((record, index) => {
      if (seen.has(record.source_id)) {
        context.addIssue({
          code: 'custom',
          path: ['records', index, 'source_id'],
          message: `Duplicate rights record for ${record.source_id}.`,
        });
      }
      seen.add(record.source_id);
    });
  });

export type SourceRightsEvidence = z.infer<typeof sourceRightsEvidenceSchema>;
