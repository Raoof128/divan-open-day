/**
 * Parse Clarke 1891 into odes with a VERSE-ONLY body.
 *
 * Why a typographic classifier rather than a textual one
 * ------------------------------------------------------
 * Clarke prints his commentary interleaved with his verse, down the page, and
 * numbers his glosses with the same `N.` form he uses for couplets:
 *
 *     8, (6).                          <- ode heading
 *     1. If that Bold One of Shiraz…   <- couplet 1
 *     For His dark mole…               <- its second hemistich
 *     Saki! give the wine…             <- couplet 2, UNNUMBERED
 *     1. Turk signifies :—             <- a NOTE indexing couplet 1
 *     2. Saki (Cup-bearer) signifies…  <- a NOTE, not couplet 2
 *
 * So neither couplet numbering nor keyword matching separates verse from notes:
 * only every fifth couplet is numbered, and the glosses look like couplets. This
 * project has now shipped that mistake three times — Whinfield's eight prose
 * acceptances, seq 757, and an ode 8 binding drawn from a footnote about Yezid.
 *
 * Clarke sets notes in smaller type than verse. Tesseract's hOCR reports x_size
 * per line, and across the book the distribution is bimodal: notes cluster at
 * <=52, verse at >=56, with a genuine valley between. That is a fact about the
 * printed page rather than a guess about the words, so it is what we classify on.
 * The valley itself (53-55) is `uncertain` and is NEVER pairable — an ambiguous
 * line is excluded individually, and one excluded line does not sink the ode.
 *
 * Classification reuses the closed enum in `classify-english-blocks.ts`; only
 * `verse_translation` may be paired.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PAIRABLE_CLASSIFICATION,
  type EnglishBlockClassification,
} from './classify-english-blocks';

/** hOCR font size below which a line is Clarke's commentary. */
export const NOTE_MAX_X_SIZE = 52;
/** hOCR font size at or above which a line is Clarke's verse. */
export const VERSE_MIN_X_SIZE = 56;
/** Running heads and ode headings are set larger still. */
export const HEADING_MIN_X_SIZE = 64;

/** `8, (6).` — Clarke's ode number and his concordance number. */
const ODE_HEADING = /^(\d{1,3})\s*,\s*\(\s*(\d{1,3})\s*\)\s*\.?\s*$/;
/** Running head, e.g. `49 DIVAN-I-HAFIZ.` / `THE LETTER ALIF 41`. */
const RUNNING_HEAD = /DIVAN-I-HAFIZ|THE\s+LETTER/i;

export interface OcrLine {
  readonly text: string;
  readonly xSize: number;
  readonly page: number;
  readonly volume: string;
}

export interface ClarkeOde {
  readonly ode: number;
  /** Clarke's parenthetical concordance number, kept verbatim. */
  readonly concordance: number;
  /**
   * Which physical volume this ode was read from. Carried, never inferred: ode
   * numbers are not unique across the two volumes, so deducing the volume from
   * the ode number silently attaches an ode to the wrong page — and therefore to
   * the wrong rhyme-letter section.
   */
  readonly volume: string;
  readonly page: number;
  readonly verse: string;
  readonly verseLines: number;
  /**
   * Clarke numbers every fifth couplet, so the highest number printed in the
   * verse is a LOWER BOUND on the ode's couplet count — never an exact count,
   * and never inferred from position. Only trustworthy because the type-size
   * filter has already removed the glosses, which carry the same `N.` form.
   * 0 when no couplet number survived OCR.
   */
  readonly maxCoupletNumber: number;
  /** The ode's opening line — Clarke renders the Persian matla' literally. */
  readonly matla: string;
  /** Lines in the 53-55 valley: excluded from `verse`, counted for honesty. */
  readonly uncertainLines: number;
  readonly noteLines: number;
}

/**
 * Classify one line by the size of its type.
 *
 * Deliberately ignores the words. Clarke's glosses are prose about the verse and
 * share its vocabulary — "Samarkand va Bukhara signifies :— Faith and the world"
 * contains every anchor the couplet does. Only the type size separates them.
 */
export function classifyByTypeSize(line: OcrLine): EnglishBlockClassification {
  if (RUNNING_HEAD.test(line.text)) return 'heading';
  if (line.xSize >= HEADING_MIN_X_SIZE) return 'heading';
  if (line.xSize >= VERSE_MIN_X_SIZE) return 'verse_translation';
  if (line.xSize <= NOTE_MAX_X_SIZE) return 'commentary';
  return 'uncertain';
}

/** Extracts `ocr_line` spans with their x_size from a tesseract hOCR page. */
export function parseHocrLines(
  hocr: string,
  page: number,
  volume = '',
): OcrLine[] {
  const lines: OcrLine[] = [];
  // An ocr_line contains nested ocrx_word spans, so a non-greedy match to the
  // first </span> would capture only the first word. Split on line starts
  // instead and take everything up to the next one.
  const starts =
    /<span class=['"]ocr_line['"][^>]*title=['"]([^'"]+)['"][^>]*>/g;
  const found: { title: string; from: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = starts.exec(hocr)) !== null) {
    found.push({ title: m[1] ?? '', from: m.index + m[0].length });
  }
  for (let i = 0; i < found.length; i += 1) {
    const entry = found[i];
    if (!entry) continue;
    const to =
      i + 1 < found.length ? (found[i + 1]?.from ?? hocr.length) : hocr.length;
    const title = entry.title;
    const body = hocr.slice(entry.from, to);
    const size = /x_size\s+([\d.]+)/.exec(title);
    const text = body
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    if (!text || !size) continue;
    lines.push({ text, xSize: Number(size[1]), page, volume });
  }
  return lines;
}

/**
 * Splits a volume's lines into odes at heading lines, keeping only verse.
 *
 * The ode number and concordance number are kept verbatim from the page. They are
 * never repaired from sequence: if a heading were missed, renumbering would shift
 * every later ode's reference silently — the defect that put Bell's poems II and
 * III inside poem I.
 */
export function splitOdes(lines: readonly OcrLine[]): ClarkeOde[] {
  const marks: { index: number; ode: number; concordance: number }[] = [];
  lines.forEach((line, index) => {
    const m = ODE_HEADING.exec(line.text);
    if (m) {
      marks.push({
        index,
        ode: Number(m[1]),
        concordance: Number(m[2]),
      });
    }
  });

  return marks.map((mark, i) => {
    const end =
      i + 1 < marks.length
        ? (marks[i + 1]?.index ?? lines.length)
        : lines.length;
    const verse: string[] = [];
    let uncertain = 0;
    let notes = 0;
    let maxCouplet = 0;
    for (let j = mark.index + 1; j < end; j += 1) {
      const line = lines[j];
      if (!line) continue;
      const kind = classifyByTypeSize(line);
      if (kind === PAIRABLE_CLASSIFICATION) {
        const numbered = /^\s*(\d{1,2})\s*[.,]\s/.exec(line.text);
        if (numbered) {
          const n = Number(numbered[1]);
          // A ghazal does not run past ~16 bayts; a larger number on a verse
          // line is OCR noise, not a couplet.
          if (n <= 16 && n > maxCouplet) maxCouplet = n;
        }
        verse.push(stripCoupletNumber(line.text));
      } else if (kind === 'uncertain') {
        uncertain += 1;
      } else if (kind === 'commentary') {
        notes += 1;
      }
    }
    return {
      ode: mark.ode,
      concordance: mark.concordance,
      volume: lines[mark.index]?.volume ?? '',
      page: lines[mark.index]?.page ?? 0,
      verse: verse.join(' ').replace(/\s+/g, ' ').trim(),
      verseLines: verse.length,
      maxCoupletNumber: maxCouplet,
      matla: verse.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim(),
      uncertainLines: uncertain,
      noteLines: notes,
    };
  });
}

/** Clarke numbers only every fifth couplet; the number is not part of the verse. */
function stripCoupletNumber(text: string): string {
  return text.replace(/^\s*\d{1,2}\s*[.,]\s*/, '');
}

export function loadVolume(root: string, volume: string): OcrLine[] {
  const dir = resolve(root, 'sources-private/poetry/clarke-ocr/text', volume);
  if (!existsSync(dir)) return [];
  const out: OcrLine[] = [];
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.hocr'))
    .sort()) {
    const page = Number(/p-(\d+)/.exec(file)?.[1] ?? '0');
    out.push(
      ...parseHocrLines(readFileSync(resolve(dir, file), 'utf8'), page, volume),
    );
  }
  return out;
}

/**
 * CLI: writes verse-only odes to `sources-private/poetry/clarke-ocr/odes.json`
 * (git-ignored). Prints counts only — never ode text.
 */
async function main(): Promise<void> {
  const { writeFileSync } = await import('node:fs');
  const root = resolve(fileURLToPath(import.meta.url), '../../..');
  const odes: ClarkeOde[] = [];
  for (const volume of ['volume-1', 'volume-2']) {
    const lines = loadVolume(root, volume);
    const parsed = splitOdes(lines);
    process.stdout.write(
      `${volume}: ${String(lines.length)} ocr lines → ${String(parsed.length)} odes\n`,
    );
    odes.push(...parsed);
  }
  const verse = odes.reduce((a, o) => a + o.verseLines, 0);
  const notes = odes.reduce((a, o) => a + o.noteLines, 0);
  const uncertain = odes.reduce((a, o) => a + o.uncertainLines, 0);
  process.stdout.write(
    `\nodes: ${String(odes.length)} (distinct ${String(new Set(odes.map((o) => o.ode)).size)})\n` +
      `lines: verse ${String(verse)} | commentary ${String(notes)} | uncertain ${String(uncertain)}\n` +
      `odes with >=4 verse lines: ${String(odes.filter((o) => o.verseLines >= 4).length)}\n`,
  );
  writeFileSync(
    resolve(root, 'sources-private/poetry/clarke-ocr/odes.json'),
    JSON.stringify({
      generatedFrom: 'tesseract-400dpi hocr x_size classification',
      odes,
    }),
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath &&
  import.meta.url.startsWith('file:') &&
  resolve(invokedPath) === resolve(fileURLToPath(import.meta.url))
) {
  main().catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
