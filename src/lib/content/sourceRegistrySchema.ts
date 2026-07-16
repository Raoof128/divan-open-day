import { z } from 'zod';

import { POETS } from '../../contracts/content';

/**
 * The immutable source editions that back the DIVAN corpus. These ids are
 * fixed: the acquisition pipeline, source-lock, extraction and rights records
 * all key off them. Adding or renaming an edition is a reviewed change.
 *
 * `hafez-clarke-1891-en` was added 2026-07-16. Bell translated only ~43 poems
 * and freely; 35 of her 40 recovered poems carry no proper noun that
 * discriminates between ghazals, so Bell alone can neither reach the 24-record
 * Hafez threshold nor identify its Persian counterpart on citable evidence.
 * Clarke is a literal, complete, per-ode-numbered crib whose first line tracks
 * the matla', which makes Hafez identification a citation check rather than a
 * thematic judgement.
 */
export const SOURCE_EDITION_IDS = [
  'hafez-qazvini-ghani-fa-wikisource',
  'hafez-bell-1897-en',
  'hafez-clarke-1891-en',
  'rumi-nicholson-fa-wikisource',
  'rumi-whinfield-abridged-en',
] as const;

export type SourceEditionId = (typeof SOURCE_EDITION_IDS)[number];

/**
 * Canonical hosts the registry declares download/evidence URLs on. `sacred-texts.com`
 * is a human cross-reading source only and is intentionally excluded from the
 * download allowlist.
 */
export const ALLOWED_SOURCE_HOSTS = [
  'archive.org',
  'ws-export.wmcloud.org',
  'fa.wikisource.org',
  'en.wikisource.org',
] as const;

/**
 * Registrable domains the acquisition layer is permitted to contact. A URL is
 * allowed when its host equals one of these OR is a subdomain of one. This
 * accommodates legitimate CDN/datanode redirects (e.g. archive.org 302s to
 * `iaNNNNNN.us.archive.org`; Wikisource/ws-export assets on `upload.wikimedia.org`)
 * while still rejecting look-alikes such as `evilarchive.org` (no leading dot).
 */
export const ALLOWED_SOURCE_DOMAINS = [
  'archive.org',
  'wmcloud.org',
  'wikisource.org',
  'wikimedia.org',
] as const;

function hostIsAllowed(host: string): boolean {
  return ALLOWED_SOURCE_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

/**
 * True only for an absolute HTTPS URL whose host is on (or under) the allowlist.
 * Exported so the downloader reuses the exact same host policy at fetch and
 * redirect time.
 */
export function isAllowlistedHttpsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && hostIsAllowed(url.hostname);
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
    /**
     * Destination basename within `raw/<source id>/`. Optional; defaults to
     * `source.<ext>`. Required in practice whenever an edition declares more
     * than one artifact of the same kind (e.g. a two-volume scan), because the
     * default name is derived from `kind` alone and would otherwise collide.
     */
    filename: z
      .string()
      .regex(
        /^[a-z0-9][a-z0-9-]{0,48}\.(epub|pdf|txt)$/,
        'filename must be a lowercase basename ending in .epub, .pdf or .txt.',
      )
      .optional(),
  })
  .strict();

export type DownloadArtifact = z.infer<typeof downloadArtifactSchema>;

/**
 * Destination basename for an artifact. Shared by the acquisition script and
 * the registry validator so both agree on exactly one filename per artifact.
 */
export function artifactFileName(artifact: DownloadArtifact): string {
  if (artifact.filename !== undefined) return artifact.filename;
  return artifact.kind === 'epub'
    ? 'source.epub'
    : artifact.kind === 'pdf'
      ? 'source.pdf'
      : 'source.txt';
}

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
  .strict()
  .superRefine((source, context) => {
    // Two artifacts resolving to one path would silently overwrite each other
    // and leave the source-lock recording two hashes for the same file. Fail
    // closed at validation instead.
    const seen = new Set<string>();
    source.download_artifacts.forEach((artifact, index) => {
      const name = artifactFileName(artifact);
      if (seen.has(name)) {
        context.addIssue({
          code: 'custom',
          path: ['download_artifacts', index, 'filename'],
          message: `Duplicate artifact filename ${name} in source ${source.id}; give each artifact a distinct filename.`,
        });
      }
      seen.add(name);
    });
  });

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
