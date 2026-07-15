/**
 * Reconstructs Gertrude Bell's 1897 English poems from the scanned source.
 *
 * The staged Bell text (`hafez-bell-en.jsonl`) is Internet Archive OCR and is
 * not publishable: `requiresVisualVerification` is true on 33 of 33 blocks,
 * `correctedDraftLines` is empty on all of them, running heads sit inside poem
 * bodies, block boundaries merge poems, and the verse itself carries
 * corruption — the archive OCR reads "easb" where the page says "east".
 *
 * This builds a second, independent reading: pages rendered at 400dpi and OCR'd
 * per page with Tesseract, then compared line-by-line against the archive OCR.
 * Where two independent readings agree, the line is corroborated. Where they
 * disagree, the line is flagged for a human or model to inspect that span alone
 * against the page image — never the whole book.
 *
 * Nothing here corrects text by guessing. Victorian spelling, Bell's
 * punctuation and her capitalisation are preserved as printed. A disagreement is
 * recorded, not resolved.
 *
 * Output is private working material and never enters Git or the public bundle.
 *
 * Usage:
 *   pnpm tsx scripts/poetry/reconstruct-bell.ts
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Publisher furniture printed on every page; never part of a poem. */
const RUNNING_HEADS = [
  /^POEMS\s+FROM\s+THE$/iu,
  /^DIVAN\s+OF\s+HAFIZ$/iu,
  /^THE\s+DIVAN\s+OF\s+HAFIZ$/iu,
];

/** A bare page number, printed alone on its line. */
const PAGE_NUMBER = /^\d{1,3}$/u;

/**
 * The running head is the structural discriminator between Bell's prose and her
 * verse, and it is printed on every page. Pages headed INTRODUCTION carry her
 * essay on Hafiz — prose that quotes him, argues about him, and is emphatically
 * not his poetry. Splitting on Roman numerals alone swept that essay in as
 * "poem I", which is the same defect that invalidated the Whinfield prose
 * summaries: commentary published as verse.
 */
const PROSE_RUNNING_HEAD = /^(INTRODUCTION|PREFACE|CONTENTS|NOTES)$/iu;
const VERSE_RUNNING_HEAD =
  /^(POEMS\s+FROM\s+THE|(THE\s+)?DIVAN\s+OF\s+HAFIZ)$/iu;

/**
 * A poem heading is a Roman numeral alone on its line — but the OCR mangles the
 * numerals themselves, in a narrow and predictable way: the serif capital I is
 * read as lowercase l, and small-caps runs come back as "Il" (II), "Ul" (III),
 * "XXVILI" (XXVII). Requiring a strictly valid numeral therefore MISSES the
 * heading entirely, and the poem below it silently merges into its predecessor
 * — which is how II and III ended up inside poem I.
 *
 * So detection and identification are separated. HEADING_SHAPE finds the
 * boundary; ROMAN_STRICT decides whether the numeral can be trusted as read.
 * A numeral that fails is kept verbatim and flagged, never repaired by
 * inference: renumbering from sequence would silently shift every later poem's
 * reference if one heading were missed.
 *
 * This costs nothing, because Bell's numeral is not a citation of Hafez. It is
 * her poem's position in her own book. The Persian reference comes from the
 * ghazal number via alignment, and the English side is cited by scan page,
 * which is known exactly and does not depend on reading the numeral.
 */
// Letters only. Arabic digits are page numbers, never poem headings — allowing
// "1" made the printed page number 111 split a poem in half.
const HEADING_SHAPE = /^[IVXLCUil]{1,7}\.?$/u;
const ROMAN_STRICT = /^(C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/u;

export interface PageLine {
  readonly page: number;
  readonly text: string;
}

export interface ReconstructedLine {
  readonly text: string;
  /** 'corroborated' when both independent readings agree after normalisation. */
  readonly status: 'corroborated' | 'disputed' | 'fresh_only';
  readonly archiveReading?: string;
}

export interface BellPoem {
  readonly poemId: string;
  /** The numeral as printed and read. Not repaired, not renumbered. */
  readonly bellNumber: string;
  readonly numeralCertain: boolean;
  readonly scanPageStart: number;
  readonly scanPageEnd: number;
  readonly firstLine: string;
  readonly lines: readonly ReconstructedLine[];
  readonly corroboratedLines: number;
  readonly disputedLines: number;
  readonly publishable: boolean;
  readonly textSha256: string;
}

/**
 * Normalise for COMPARISON only; the returned form is never published.
 *
 * The question this answers is narrow: do two independent readings agree on the
 * WORDS of a line? They routinely differ on things that are not disagreements
 * about the page — the archive OCR double-spaces everything, prints Bell's
 * small-caps opening word as "ARISE", and sets punctuation off with spaces
 * ("rise  !"). Comparing with punctuation kept made "rise !" and "rise!" a
 * conflict and flagged a perfect match as disputed.
 *
 * So: compare letters and numbers only. Punctuation and case variance between
 * the two readings is recorded as its own, lesser fact — not a word conflict.
 */
export function normaliseForComparison(line: string): string {
  return line
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();
}

export function isFurniture(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return true;
  if (PAGE_NUMBER.test(trimmed)) return true;
  if (PROSE_RUNNING_HEAD.test(trimmed)) return true;
  return RUNNING_HEADS.some((pattern) => pattern.test(trimmed));
}

/**
 * Keep only the pages of the verse section. Classification carries forward: a
 * page whose running head the OCR dropped belongs to the section it follows,
 * exactly as the Whinfield classifier carries the NOTES marker forward. Pages
 * before any recognised head are front matter and are dropped.
 */
export function verseOnlyPages(pages: readonly PageLine[]): PageLine[] {
  const byPage = new Map<number, string[]>();
  for (const { page, text } of pages) {
    const bucket = byPage.get(page);
    if (bucket === undefined) byPage.set(page, [text]);
    else bucket.push(text);
  }

  const kept: PageLine[] = [];
  let section: 'verse' | 'prose' | 'unknown' = 'unknown';
  for (const page of [...byPage.keys()].sort((a, b) => a - b)) {
    const lines = byPage.get(page) ?? [];
    const classification = classifyPage(lines);
    if (classification !== 'unknown') section = classification;
    if (section !== 'verse') continue;
    for (const text of lines) kept.push({ page, text });
  }
  return kept;
}

export interface Heading {
  /** The numeral exactly as the page was read. Never repaired. */
  readonly asRead: string;
  /** False when the numeral is OCR-damaged and cannot be trusted as read. */
  readonly certain: boolean;
}

export function romanHeading(line: string): Heading | null {
  const trimmed = line.trim();
  if (!HEADING_SHAPE.test(trimmed)) return null;
  const asRead = trimmed.replace(/\.$/u, '');
  if (asRead.length === 0) return null;
  return { asRead, certain: ROMAN_STRICT.test(asRead) };
}

/** Classify a page by its running head. Only verse pages may yield poems. */
export function classifyPage(
  lines: readonly string[],
): 'verse' | 'prose' | 'unknown' {
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim();
    if (PROSE_RUNNING_HEAD.test(trimmed)) return 'prose';
    if (VERSE_RUNNING_HEAD.test(trimmed)) return 'verse';
  }
  return 'unknown';
}

/** Read the per-page Tesseract output, in page order. */
export function readFreshPages(textDir: string): PageLine[] {
  if (!existsSync(textDir)) return [];
  const files = readdirSync(textDir)
    .filter((name) => name.endsWith('.txt'))
    .sort();
  const out: PageLine[] = [];
  for (const file of files) {
    const match = /p-(\d+)\.txt$/u.exec(file);
    if (match?.[1] === undefined) continue;
    const page = Number(match[1]);
    const body = readFileSync(resolve(textDir, file), 'utf8');
    for (const raw of body.split('\n')) {
      out.push({ page, text: raw.trimEnd() });
    }
  }
  return out;
}

/**
 * Split the page stream into poems at Roman-numeral headings, dropping
 * publisher furniture. Bell's poems run across page boundaries, which is
 * exactly what the staged block extraction got wrong.
 */
interface SplitPoem {
  bellNumber: string;
  numeralCertain: boolean;
  start: number;
  end: number;
  lines: string[];
}

export function splitPoems(pages: readonly PageLine[]): SplitPoem[] {
  const poems: SplitPoem[] = [];
  let current: SplitPoem | null = null;

  for (const { page, text } of pages) {
    // Furniture first: a page number must never be mistaken for a heading.
    if (isFurniture(text)) continue;
    const heading = romanHeading(text);
    if (heading !== null) {
      if (current !== null) poems.push(current);
      current = {
        bellNumber: heading.asRead,
        numeralCertain: heading.certain,
        start: page,
        end: page,
        lines: [],
      };
      continue;
    }
    if (current === null) continue;
    current.lines.push(text.replace(/\s+/gu, ' ').trim());
    current.end = page;
  }
  if (current !== null) poems.push(current);
  return poems;
}

/** Index the archive OCR by its normalised form for corroboration lookup. */
export function archiveIndex(archiveText: string): Set<string> {
  const set = new Set<string>();
  for (const line of archiveText.split('\n')) {
    const key = normaliseForComparison(line);
    if (key.length > 0) set.add(key);
  }
  return set;
}

export function corroborate(
  lines: readonly string[],
  archive: Set<string>,
): ReconstructedLine[] {
  return lines.map((text) => {
    const key = normaliseForComparison(text);
    if (archive.has(key)) return { text, status: 'corroborated' as const };
    return { text, status: 'disputed' as const };
  });
}

export function buildPoems(
  pages: readonly PageLine[],
  archiveText: string,
): BellPoem[] {
  const archive = archiveIndex(archiveText);
  return splitPoems(verseOnlyPages(pages))
    .filter((poem) => poem.lines.length >= 4)
    .map((poem) => {
      const lines = corroborate(poem.lines, archive);
      const corroborated = lines.filter(
        (line) => line.status === 'corroborated',
      ).length;
      const disputed = lines.length - corroborated;
      const text = lines.map((line) => line.text).join('\n');
      return {
        // Identify by scan page, which is read reliably, rather than by a
        // numeral the OCR may have damaged.
        poemId: `hafez-bell-1897-p${String(poem.start).padStart(3, '0')}`,
        bellNumber: poem.bellNumber,
        numeralCertain: poem.numeralCertain,
        scanPageStart: poem.start,
        scanPageEnd: poem.end,
        firstLine: lines[0]?.text ?? '',
        lines,
        corroboratedLines: corroborated,
        disputedLines: disputed,
        // A poem is publishable only when two independent readings agree on
        // every line. One disputed line is one chance to publish a machine's
        // guess as Gertrude Bell's poetry.
        publishable: disputed === 0,
        textSha256: createHash('sha256').update(text, 'utf8').digest('hex'),
      };
    });
}

function main(): void {
  const root = process.cwd();
  const textDir = resolve(root, 'sources-private/poetry/bell-ocr/text');
  const archivePath = resolve(
    root,
    'sources-private/poetry/raw/hafez-bell-1897-en/source.txt',
  );

  const pages = readFreshPages(textDir);
  if (pages.length === 0) {
    process.stdout.write(
      'No fresh OCR pages found. Render and OCR the scan first.\n',
    );
    return;
  }
  const archiveText = existsSync(archivePath)
    ? readFileSync(archivePath, 'utf8')
    : '';

  const poems = buildPoems(pages, archiveText);
  const publishable = poems.filter((poem) => poem.publishable);
  const out = resolve(root, 'sources-private/poetry/bell-ocr/bell-poems.json');
  writeFileSync(
    out,
    `${JSON.stringify({ generatedFrom: 'tesseract-400dpi + archive-ocr consensus', poems }, null, 2)}\n`,
    'utf8',
  );

  const totalLines = poems.reduce((sum, poem) => sum + poem.lines.length, 0);
  const totalDisputed = poems.reduce(
    (sum, poem) => sum + poem.disputedLines,
    0,
  );
  process.stdout.write(
    `Bell reconstruction: ${String(poems.length)} poems, ${String(totalLines)} lines, ` +
      `${String(totalLines - totalDisputed)} corroborated by two independent readings, ` +
      `${String(totalDisputed)} disputed. ` +
      `${String(publishable.length)} poems fully corroborated.\n`,
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
