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
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

/**
 * Cross-language pairing cannot use token overlap: Persian and English share no
 * tokens. Instead we match transliterated PROPER NOUNS and a few recurring
 * images/characters — the signal that actually links a named Masnavi story or a
 * Hafez motif to its translation. This is a weak ranking HINT only; a real
 * bilingual pairing is the reviewer's judgement (every record requiresHumanReview).
 */
const BILINGUAL_TERMS: Record<string, readonly string[]> = {
  hafiz: ['حافظ'],
  hafez: ['حافظ'],
  shiraz: ['شیراز'],
  layli: ['لیلی', 'لیلا'],
  layla: ['لیلی', 'لیلا'],
  majnun: ['مجنون'],
  joseph: ['یوسف'],
  jacob: ['یعقوب'],
  moses: ['موسی'],
  jesus: ['عیسی'],
  solomon: ['سلیمان'],
  sheba: ['بلقیس'],
  bilqis: ['بلقیس'],
  pharaoh: ['فرعون'],
  abraham: ['ابراهیم'],
  adam: ['آدم'],
  noah: ['نوح'],
  ali: ['علی'],
  omar: ['عمر'],
  muhammad: ['محمد', 'مصطفی'],
  mustafa: ['مصطفی'],
  wolf: ['گرگ'],
  lion: ['شیر'],
  elephant: ['پیل', 'فیل'],
  parrot: ['طوطی'],
  reed: ['نی'],
  rose: ['گل'],
  nightingale: ['بلبل'],
  wine: ['باده', 'شراب'],
  king: ['شاه', 'پادشاه', 'ملک'],
  slave: ['غلام', 'کنیز'],
  vizier: ['وزیر'],
  merchant: ['بازرگان', 'تاجر'],
  garden: ['باغ', 'بستان'],
  soul: ['جان', 'روح'],
  heart: ['دل'],
  god: ['خدا'],
  love: ['عشق'],
};

/** Count of bilingual terms whose English token AND Persian equivalent co-occur. */
function bilingualScore(
  persianText: string,
  englishTokens: ReadonlySet<string>,
): number {
  let hits = 0;
  for (const [english, persianForms] of Object.entries(BILINGUAL_TERMS)) {
    if (
      englishTokens.has(english) &&
      persianForms.some((form) => persianText.includes(form))
    ) {
      hits += 1;
    }
  }
  return hits;
}

export interface BuildCandidateIndexOptions {
  readonly poet: (typeof POETS)[number];
  readonly persianBlocks: readonly PersianStagingBlock[];
  readonly englishSections: readonly EnglishCandidateSection[];
  readonly topN?: number;
  /**
   * Which side drives the top-N ranking. Anchor on the SELECTION/abridged side
   * (usually the smaller set) so each of those poems gets its best matches and
   * the index stays proportionate. Defaults to 'persian'.
   */
  readonly anchor?: 'persian' | 'english';
}

function makeRecord(
  poet: (typeof POETS)[number],
  block: PersianStagingBlock,
  section: EnglishCandidateSection,
  score: number,
): CandidateMapping {
  return {
    candidateId: `cand-${poet}-p${String(block.sequence).padStart(4, '0')}-${section.reference}`,
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
  };
}

/**
 * Produces the ranked candidate index. Pure and deterministic: sorted by Persian
 * sequence, then descending score, then English reference.
 */
export function buildCandidateIndex(
  options: BuildCandidateIndexOptions,
): CandidateMapping[] {
  const {
    poet,
    persianBlocks,
    englishSections,
    topN = 3,
    anchor = 'persian',
  } = options;
  const englishTokens = englishSections.map((section) => ({
    section,
    tokens: tokenSet(section.searchText),
  }));

  const records: CandidateMapping[] = [];
  if (anchor === 'english') {
    for (const { section, tokens } of englishTokens) {
      const ranked = persianBlocks
        .map((block) => ({
          block,
          score: bilingualScore(block.searchText, tokens),
        }))
        .sort(
          (a, b) => b.score - a.score || a.block.sequence - b.block.sequence,
        )
        .slice(0, topN);
      for (const { block, score } of ranked) {
        records.push(makeRecord(poet, block, section, score));
      }
    }
  } else {
    for (const block of persianBlocks) {
      const ranked = englishTokens
        .map(({ section, tokens }) => ({
          section,
          score: bilingualScore(block.searchText, tokens),
        }))
        .sort(
          (a, b) =>
            b.score - a.score ||
            a.section.reference.localeCompare(b.section.reference),
        )
        .slice(0, topN);
      for (const { section, score } of ranked) {
        records.push(makeRecord(poet, block, section, score));
      }
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

interface StagingRow {
  readonly sourceId: string;
  readonly sequence?: number;
  readonly searchText?: string;
  readonly rawText?: string;
  readonly rawTextSha256?: string;
  readonly documentPath?: string;
  readonly headingPath?: string[];
  readonly candidateId?: string;
  readonly rawOcrLines?: string[];
}

// Front/back-matter and digital-edition chrome that is not verse.
const ENGLISH_NOISE =
  /about this digital edition|wikisource|digital edition|table of contents|^contents$|title page|copyright|the works of/u;
// A Persian TOC/index line typically ends with a page number (Persian digits).
const PERSIAN_TOC = /[۰-۹0-9]{2,}\s*$/u;

/** Persian staging (EPUB extractor or Masnavi fetcher) → PersianStagingBlock. */
function toPersianBlocks(rows: StagingRow[]): PersianStagingBlock[] {
  return rows
    .filter(
      (row) =>
        typeof row.searchText === 'string' &&
        row.searchText.trim().length >= 12 &&
        // Skip table-of-contents / index fragments (a bare title + page number).
        !PERSIAN_TOC.test(row.searchText) &&
        typeof row.rawTextSha256 === 'string',
    )
    .map((row, index) => ({
      sourceId: row.sourceId,
      sequence: row.sequence ?? index,
      searchText: row.searchText ?? '',
      rawTextSha256: row.rawTextSha256 ?? '',
    }));
}

/** Bell OCR candidates (rawOcrLines) → EnglishCandidateSection. */
function bellToEnglish(rows: StagingRow[]): EnglishCandidateSection[] {
  return rows
    .filter(
      (row) => Array.isArray(row.rawOcrLines) && row.rawOcrLines.length > 0,
    )
    .map((row) => ({
      sourceId: row.sourceId,
      reference: row.candidateId ?? 'bell-unknown',
      searchText: (row.rawOcrLines ?? []).join(' ').toLowerCase(),
    }));
}

/** EPUB-extracted English blocks (Whinfield) → EnglishCandidateSection. */
function extractedToEnglish(rows: StagingRow[]): EnglishCandidateSection[] {
  return rows
    .filter(
      (row) =>
        typeof row.searchText === 'string' &&
        row.searchText.length >= 12 &&
        !ENGLISH_NOISE.test(row.searchText.toLowerCase()),
    )
    .map((row, index) => ({
      sourceId: row.sourceId,
      reference: `${row.headingPath?.[0] ?? row.documentPath ?? 'sec'}#${String(row.sequence ?? index)}`,
      searchText: row.searchText ?? '',
    }));
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
      englishKind: 'bell' as const,
      // Bell is a 33-poem selection: anchor on it so each Bell poem gets matches.
      anchor: 'english' as const,
      out: 'hafez-candidates.json',
    },
    {
      poet: 'rumi' as const,
      persian: 'rumi-fa.jsonl',
      english: 'rumi-whinfield-en.jsonl',
      englishKind: 'extracted' as const,
      // Persian Masnavi sections are the smaller anchored set here.
      anchor: 'persian' as const,
      out: 'rumi-candidates.json',
    },
  ];

  let total = 0;
  for (const job of jobs) {
    const persianBlocks = toPersianBlocks(
      readJsonl<StagingRow>(resolve(extracted, job.persian)),
    );
    const englishRows = readJsonl<StagingRow>(resolve(extracted, job.english));
    const englishSections =
      job.englishKind === 'bell'
        ? bellToEnglish(englishRows)
        : extractedToEnglish(englishRows);
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
      topN: 3,
      anchor: job.anchor,
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
