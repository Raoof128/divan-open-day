/**
 * Builds a MACHINE candidate mapping index between extracted Persian staging
 * blocks and English candidate sections (Bell / Whinfield). These are ranking
 * HINTS for a human reviewer only. Every record is explicitly:
 *   machineGeneratedCandidate: true, publishable: false, requiresHumanReview: true,
 *   confidence: 'candidate'
 * and can NEVER be 'verified'. The production content compiler refuses these
 * records outright (they are not authoring items). Nothing here is public content.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { POETS } from '../../src/contracts/content';

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

export const candidateMappingSchema = z
  .object({
    candidateId: z.string().min(1),
    poet: z.enum(POETS),
    persian: z
      .object({
        sourceId: z.string().min(1),
        sequence: z.number().int().min(0),
        searchTextExcerpt: z.string().min(1),
        rawTextSha256: z.string().regex(SHA256_PATTERN),
      })
      .strict(),
    english: z
      .object({
        sourceId: z.string().min(1),
        reference: z.string().min(1),
        searchTextExcerpt: z.string().min(1),
      })
      .strict(),
    score: z.number().min(0),
    method: z.enum(['heading-overlap', 'keyword-overlap']),
    confidence: z.literal('candidate'),
    machineGeneratedCandidate: z.literal(true),
    publishable: z.literal(false),
    requiresHumanReview: z.literal(true),
  })
  .strict();

export type CandidateMapping = z.infer<typeof candidateMappingSchema>;

export interface PersianStagingBlock {
  readonly sourceId: string;
  readonly sequence: number;
  readonly searchText: string;
  readonly rawTextSha256: string;
}

export interface EnglishCandidateSection {
  readonly sourceId: string;
  readonly reference: string;
  readonly searchText: string;
}

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'of',
  'and',
  'to',
  'in',
  'is',
  'for',
  'که',
  'را',
  'با',
  'از',
  'به',
  'در',
]);

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .split(/\s+/u)
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

/** Jaccard-style overlap; a ranking hint only, never evidence of a real match. */
function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) {
      shared += 1;
    }
  }
  return shared / (a.size + b.size - shared);
}

export interface BuildCandidateIndexOptions {
  readonly poet: (typeof POETS)[number];
  readonly persianBlocks: readonly PersianStagingBlock[];
  readonly englishSections: readonly EnglishCandidateSection[];
  readonly topN?: number;
}

/**
 * Produces the ranked candidate index. Pure and deterministic: sorted by Persian
 * sequence, then descending score, then English reference.
 */
export function buildCandidateIndex(
  options: BuildCandidateIndexOptions,
): CandidateMapping[] {
  const { poet, persianBlocks, englishSections, topN = 3 } = options;
  const englishTokens = englishSections.map((section) => ({
    section,
    tokens: tokenSet(section.searchText),
  }));

  const records: CandidateMapping[] = [];
  for (const block of persianBlocks) {
    const blockTokens = tokenSet(block.searchText);
    const ranked = englishTokens
      .map(({ section, tokens }) => ({
        section,
        score: overlapScore(blockTokens, tokens),
      }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.section.reference.localeCompare(b.section.reference),
      )
      .slice(0, topN);

    for (const { section, score } of ranked) {
      records.push({
        candidateId: `cand-${poet}-${String(block.sequence).padStart(4, '0')}-${section.reference}`,
        poet,
        persian: {
          sourceId: block.sourceId,
          sequence: block.sequence,
          searchTextExcerpt: block.searchText.slice(0, 200),
          rawTextSha256: block.rawTextSha256,
        },
        english: {
          sourceId: section.sourceId,
          reference: section.reference,
          searchTextExcerpt: section.searchText.slice(0, 200),
        },
        score: Number(score.toFixed(4)),
        method: 'keyword-overlap',
        confidence: 'candidate',
        machineGeneratedCandidate: true,
        publishable: false,
        requiresHumanReview: true,
      });
    }
  }

  return records.sort(
    (a, b) =>
      a.persian.sequence - b.persian.sequence ||
      b.score - a.score ||
      a.english.reference.localeCompare(b.english.reference),
  );
}

function readJsonl<T>(path: string): T[] {
  if (!existsSync(path)) {
    return [];
  }
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as T);
}

function main(): void {
  const root = process.cwd();
  const extracted = resolve(root, 'sources-private/poetry/extracted');
  const reports = resolve(root, 'sources-private/poetry/reports');

  const jobs = [
    {
      poet: 'hafez' as const,
      persian: 'hafez-fa.jsonl',
      english: 'hafez-bell-en.jsonl',
      out: 'hafez-candidates.json',
    },
    {
      poet: 'rumi' as const,
      persian: 'rumi-fa.jsonl',
      english: 'rumi-whinfield-en.jsonl',
      out: 'rumi-candidates.json',
    },
  ];

  let total = 0;
  for (const job of jobs) {
    const persianBlocks = readJsonl<PersianStagingBlock>(
      resolve(extracted, job.persian),
    );
    const englishSections = readJsonl<EnglishCandidateSection>(
      resolve(extracted, job.english),
    );
    if (persianBlocks.length === 0 || englishSections.length === 0) {
      process.stdout.write(
        `• ${job.poet}: staging not ready (need extracted Persian + English). Skipping.\n`,
      );
      continue;
    }
    const index = buildCandidateIndex({
      poet: job.poet,
      persianBlocks,
      englishSections,
    });
    writeFileSync(
      resolve(reports, job.out),
      `${JSON.stringify(
        {
          machineGeneratedCandidate: true,
          publishable: false,
          requiresHumanReview: true,
          generatedFrom: { persian: job.persian, english: job.english },
          candidates: index,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    total += index.length;
  }

  process.stdout.write(
    total === 0
      ? 'No candidate index generated (staging not ready). This is expected pre-fetch.\n'
      : `Wrote ${String(total)} machine candidates (NOT publishable; require human review).\n`,
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  import.meta.url.startsWith('file:') &&
  resolve(invokedPath) === resolve(fileURLToPath(import.meta.url))
) {
  main();
}
