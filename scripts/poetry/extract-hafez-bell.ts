/**
 * Parses Gertrude Bell's 1897 *Poems from the Divan of Hafiz* OCR into CANDIDATE
 * English sections. Bell is a SELECTION, and OCR is unreliable, so this parser is
 * deliberately conservative:
 *  - it retains the raw OCR lines verbatim and NEVER rewrites the wording;
 *  - `correctedDraftLines` stays empty until a human verifies against the scan;
 *  - every candidate is flagged `requiresVisualVerification`;
 *  - front matter and the notes apparatus are excluded from verse candidates.
 *
 * Nothing here is publishable. It only proposes where a human should look.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BELL_SOURCE_ID = 'hafez-bell-1897-en';

export interface BellCandidate {
  readonly sourceId: typeof BELL_SOURCE_ID;
  readonly candidateId: string;
  readonly heading: string | null;
  readonly rawOcrLines: string[];
  /** Empty until a human transcribes from the PDF scan. Never auto-filled. */
  readonly correctedDraftLines: string[];
  readonly pdfPageStart: number | null;
  readonly pdfPageEnd: number | null;
  readonly requiresVisualVerification: true;
  readonly suspiciousLineIndexes: number[];
}

const ROMAN_HEADING = /^\s*([IVXLCDM]+\.)\s*$/u;
const NOTES_HEADING = /^\s*(NOTES|GLOSSARY|APPENDIX|INDEX)\s*$/u;
const PAGE_NUMBER = /^\s*(\d{1,4})\s*$/u;
const SENTINELS = /(TEST ONLY|NOT POETRY|NOT TRANSLATION|SYNTHETIC)/u;

function isSuspicious(line: string): boolean {
  return (
    /-\s*$/u.test(line) || // trailing hyphenation
    / {2,}/u.test(line) || // collapsed OCR spacing
    SENTINELS.test(line) ||
    /\bl\b|\brn\b/u.test(line) // common OCR ligature confusions
  );
}

/**
 * Splits Bell OCR text into candidate verse sections. Pure and deterministic.
 */
export function parseBellOcr(ocrText: string): BellCandidate[] {
  const lines = ocrText.split(/\r?\n/u);
  const candidates: BellCandidate[] = [];

  let lastPage: number | null = null;
  let inNotes = false;
  let current: {
    heading: string | null;
    rawOcrLines: string[];
    pdfPageStart: number | null;
    pdfPageEnd: number | null;
  } | null = null;

  const finalize = (): void => {
    if (current && current.rawOcrLines.length > 0) {
      const index = candidates.length + 1;
      candidates.push({
        sourceId: BELL_SOURCE_ID,
        candidateId: `hafez-bell-c${String(index).padStart(3, '0')}`,
        heading: current.heading,
        rawOcrLines: current.rawOcrLines,
        correctedDraftLines: [],
        pdfPageStart: current.pdfPageStart,
        pdfPageEnd: current.pdfPageEnd ?? current.pdfPageStart,
        requiresVisualVerification: true,
        suspiciousLineIndexes: current.rawOcrLines
          .map((line, i) => (isSuspicious(line) ? i : -1))
          .filter((i) => i >= 0),
      });
    }
    current = null;
  };

  for (const line of lines) {
    const pageMatch = PAGE_NUMBER.exec(line);
    if (pageMatch) {
      lastPage = Number.parseInt(pageMatch[1] ?? '', 10);
      if (current) {
        current.pdfPageEnd = lastPage;
      }
      continue;
    }

    if (NOTES_HEADING.test(line)) {
      finalize();
      inNotes = true;
      continue;
    }
    if (inNotes) {
      continue;
    }

    const headingMatch = ROMAN_HEADING.exec(line);
    if (headingMatch) {
      finalize();
      current = {
        heading: headingMatch[1] ?? null,
        rawOcrLines: [],
        pdfPageStart: lastPage,
        pdfPageEnd: lastPage,
      };
      continue;
    }

    if (line.trim().length === 0) {
      continue;
    }

    // Body line: only collected once inside a section (front matter is skipped).
    if (current) {
      current.rawOcrLines.push(line);
    }
  }

  finalize();
  return candidates;
}

function main(): void {
  const root = process.cwd();
  const input = resolve(
    root,
    'sources-private/poetry/raw',
    BELL_SOURCE_ID,
    'source.txt',
  );
  const output = resolve(
    root,
    'sources-private/poetry/extracted/hafez-bell-en.jsonl',
  );

  if (!existsSync(input)) {
    process.stdout.write(
      `Bell OCR not acquired yet (${BELL_SOURCE_ID}). Run \`pnpm poetry:fetch\` first.\n`,
    );
    return;
  }

  const candidates = parseBellOcr(readFileSync(input, 'utf8'));
  const jsonl = candidates
    .map((candidate) => JSON.stringify(candidate))
    .join('\n');
  writeFileSync(output, jsonl.length > 0 ? `${jsonl}\n` : '', 'utf8');
  process.stdout.write(
    `Parsed ${String(candidates.length)} Bell candidate section(s) (all require human visual verification).\n`,
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
