import { z } from 'zod';

import { POETS } from '../../contracts/content';

/**
 * The four immutable source editions that back the DIVAN corpus. These ids are
 * fixed: the acquisition pipeline, source-lock, extraction and rights records
 * all key off them. Adding or renaming an edition is a reviewed change.
 */
export const SOURCE_EDITION_IDS = [
  'hafez-qazvini-ghani-fa-wikisource',
  'hafez-bell-1897-en',
  'rumi-nicholson-fa-wikisource',
  'rumi-whinfield-abridged-en',
] as const;

export type SourceEditionId = (typeof SOURCE_EDITION_IDS)[number];

/**
 * Hosts the acquisition layer is permitted to contact. Every registry URL and
 * every redirect target must resolve to one of these. `sacred-texts.com` is a
 * human cross-reading source only and is intentionally excluded from the
 * download allowlist.
 */
export const ALLOWED_SOURCE_HOSTS = [
  'archive.org',
  'ws-export.wmcloud.org',
  'fa.wikisource.org',
  'en.wikisource.org',
] as const;

const ALLOWED_HOST_SET: ReadonlySet<string> = new Set(ALLOWED_SOURCE_HOSTS);

/**
 * True only for an absolute HTTPS URL whose host is on the allowlist. Exported
 * so the downloader can reuse the exact same host policy at fetch and redirect
 * time.
 */
export function isAllowlistedHttpsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && ALLOWED_HOST_SET.has(url.hostname);
}

const allowlistedHttpsUrl = z
  .string()
  .max(2_000)
  .refine(
    isAllowlistedHttpsUrl,
    'URL must be absolute HTTPS on an allowlisted source host.',
  );

const nonBlankText = (maximumLength: number) =>
  z
    .string()
    .min(1)
    .max(maximumLength)
    .refine((value) => value.trim().length > 0, 'Text cannot be blank.');

const downloadArtifactSchema = z
  .object({
    kind: z.enum(['epub', 'pdf', 'text']),
    url: allowlistedHttpsUrl,
    required: z.boolean(),
    max_bytes: z.number().int().positive().max(200_000_000),
  })
  .strict();

const rightsSchema = z
  .object({
    original_status: nonBlankText(600),
    transcription_licence: nonBlankText(300),
    attribution_required: z.boolean(),
    evidence_url: allowlistedHttpsUrl,
  })
  .strict();

export const sourceEditionSchema = z
  .object({
    id: z.enum(SOURCE_EDITION_IDS),
    poet: z.enum(POETS),
    language: z.enum(['fa', 'en']),
    work_title: nonBlankText(200),
    edition_label: nonBlankText(300),
    completeness: z.enum(['complete', 'selection', 'abridged']),
    canonical_page_url: allowlistedHttpsUrl,
    download_artifacts: z.array(downloadArtifactSchema).min(1).max(6),
    rights: rightsSchema,
  })
  .strict();

export type SourceEdition = z.infer<typeof sourceEditionSchema>;

export const sourceRegistrySchema = z
  .object({
    schema_version: z.literal(1),
    sources: z.array(sourceEditionSchema),
  })
  .strict()
  .superRefine((registry, context) => {
    const seen = new Set<string>();
    registry.sources.forEach((source, index) => {
      if (seen.has(source.id)) {
        context.addIssue({
          code: 'custom',
          path: ['sources', index, 'id'],
          message: `Duplicate source id ${source.id}.`,
        });
      }
      seen.add(source.id);
    });

    for (const requiredId of SOURCE_EDITION_IDS) {
      if (!seen.has(requiredId)) {
        context.addIssue({
          code: 'custom',
          path: ['sources'],
          message: `Registry is missing required source edition ${requiredId}.`,
        });
      }
    }
  });

export type SourceRegistry = z.infer<typeof sourceRegistrySchema>;
