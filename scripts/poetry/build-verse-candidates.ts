/**
 * Builds the verse-only candidate inventory for Rumi (Whinfield ↔ Nicholson).
 *
 * Supersedes the body keyword-overlap path in `build-candidate-index.ts` for
 * Rumi. Two repairs, both mandated by the 2026-07-14 preflight audit:
 *
 *  1. The English side is classified first, and only `verse_translation`
 *     segments are eligible. Prose arguments — the eight accepted pairings the
 *     audit rejected — can no longer reach a pairing at all.
 *  2. Ranking is source-aware (section title against section title) rather than
 *     bilingual token overlap across whole bodies.
 *
 * Everything excluded is recorded with its reason, so the exclusion is auditable
 * rather than silent. Output is a review HINT: every record stays
 * publishable:false / requiresHumanReview:true. Nothing here approves anything.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  alignVerseUnit,
  englishBookFromDocumentPath,
  type AlignedVerseUnit,
  type PersianSection,
} from './align-verse-sections';
import {
  classifyEnglishBlocks,
  PAIRABLE_CLASSIFICATION,
  type ClassifiedSegment,
  type EnglishSourceBlock,
} from './classify-english-blocks';

interface RawEnglishRow extends EnglishSourceBlock {
  readonly documentPath: string;
}

interface RawPersianRow {
  readonly sequence: number;
  readonly headingPath: readonly string[];
  readonly rawTextSha256: string;
}

export interface ExclusionRecord {
  readonly segmentId: string;
  readonly sourceId: string;
  readonly blockSequence: number;
  readonly classification: string;
  readonly reason: string;
  readonly lineCount: number;
  /** Digest, not text: the exclusion is provable without copying the source. */
  readonly textSha256: string;
}

export interface VerseCandidateReport {
  readonly machineGeneratedCandidate: true;
  readonly publishable: false;
  readonly requiresHumanReview: true;
  readonly note: string;
  readonly method: 'section-title-alignment';
  readonly totals: {
    readonly englishSegments: number;
    readonly pairableVerseSegments: number;
    readonly excludedSegments: number;
    readonly persianSections: number;
    readonly unitsWithCandidates: number;
    readonly unitsWithNoSignal: number;
  };
  readonly excludedByClassification: Readonly<Record<string, number>>;
  readonly units: readonly AlignedVerseUnit[];
  readonly exclusions: readonly ExclusionRecord[];
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

function toExclusion(segment: ClassifiedSegment): ExclusionRecord {
  return {
    segmentId: segment.segmentId,
    sourceId: segment.sourceId,
    blockSequence: segment.blockSequence,
    classification: segment.classification,
    reason: segment.reason,
    lineCount: segment.lineCount,
    textSha256: segment.textSha256,
  };
}

export function buildVerseCandidateReport(
  englishRows: readonly RawEnglishRow[],
  persianRows: readonly RawPersianRow[],
): VerseCandidateReport {
  const bookBySequence = new Map<number, number | null>(
    englishRows.map((row) => [
      row.sequence,
      englishBookFromDocumentPath(row.documentPath),
    ]),
  );

  const segments = classifyEnglishBlocks(englishRows);
  const verse = segments.filter(
    (segment) => segment.classification === PAIRABLE_CLASSIFICATION,
  );
  const excluded = segments.filter(
    (segment) => segment.classification !== PAIRABLE_CLASSIFICATION,
  );

  const sections: PersianSection[] = persianRows
    .filter((row) => (row.headingPath[0] ?? '').length > 0)
    .map((row) => ({
      sequence: row.sequence,
      title: row.headingPath[0] ?? '',
      rawTextSha256: row.rawTextSha256,
    }));

  const units = verse.map((segment) =>
    alignVerseUnit(
      {
        segmentId: segment.segmentId,
        // Both titles carry signal and they carry different signal. The story
        // heading names the figures ("Moses and the Shepherd"); the verse
        // section title names the passage within the story ("Description of
        // Love"), and is often abstract enough to identify nothing on its own.
        // Score the union so an abstract section title still inherits its
        // story's identifying terms.
        title: [segment.headingPath[0] ?? '', segment.subheading ?? '']
          .filter((part) => part.length > 0)
          .join(' '),
        storyHeading: segment.headingPath[0] ?? '',
        book: bookBySequence.get(segment.blockSequence) ?? null,
      },
      sections,
    ),
  );

  const excludedByClassification: Record<string, number> = {};
  for (const segment of excluded) {
    excludedByClassification[segment.classification] =
      (excludedByClassification[segment.classification] ?? 0) + 1;
  }

  return {
    machineGeneratedCandidate: true,
    publishable: false,
    requiresHumanReview: true,
    note: 'Verse-only machine candidate index. NOT public content. Ranking is a review hint from section-title alignment; it approves nothing. Excluded segments are retained as provenance and can never be paired.',
    method: 'section-title-alignment',
    totals: {
      englishSegments: segments.length,
      pairableVerseSegments: verse.length,
      excludedSegments: excluded.length,
      persianSections: sections.length,
      unitsWithCandidates: units.filter((unit) => !unit.noSignal).length,
      unitsWithNoSignal: units.filter((unit) => unit.noSignal).length,
    },
    excludedByClassification,
    units,
    exclusions: excluded.map(toExclusion),
  };
}

function main(): void {
  const root = process.cwd();
  const extracted = resolve(root, 'sources-private/poetry/extracted');
  const reports = resolve(root, 'sources-private/poetry/reports');

  const englishRows = readJsonl<RawEnglishRow>(
    resolve(extracted, 'rumi-whinfield-en.jsonl'),
  );
  const persianRows = readJsonl<RawPersianRow>(
    resolve(extracted, 'rumi-fa.jsonl'),
  );

  if (englishRows.length === 0 || persianRows.length === 0) {
    process.stdout.write(
      'Rumi staging not ready (need extracted Persian + English). Skipping.\n',
    );
    return;
  }

  const report = buildVerseCandidateReport(englishRows, persianRows);
  writeFileSync(
    resolve(reports, 'rumi-verse-candidates.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );

  const { totals } = report;
  process.stdout.write(
    `Verse-only Rumi index: ${String(totals.pairableVerseSegments)} pairable verse segments ` +
      `(${String(totals.excludedSegments)} excluded), ` +
      `${String(totals.unitsWithCandidates)} with candidates, ` +
      `${String(totals.unitsWithNoSignal)} with no signal. ` +
      'NOT publishable; requires human review.\n',
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
