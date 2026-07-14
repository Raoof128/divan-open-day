/**
 * Classifies extracted English source blocks by what they actually ARE.
 *
 * An English source edition is not uniformly poetry. Whinfield's abridgement
 * prints, per story: a prose argument, then verse translation, then `NOTES:`
 * and numbered footnotes. The 2026-07-14 preflight audit
 * (docs/audits/divan/2026-07-14-machine-alignment-preflight.md) found eight
 * pairings that had attached Persian verse to Whinfield's PROSE ARGUMENT — the
 * story's summary — and a human reviewer accepted all eight. The cause was the
 * pairing unit: the whole story-body block, whose first line is the argument and
 * whose remaining lines are the verse nobody ever saw.
 *
 * This module is that missing gate. It segments a block into runs and gives each
 * run a classification from a closed enum. Only `verse_translation` may be the
 * English side of a public pairing; everything else is provenance only.
 *
 * The signals are structural, never thematic. Prose is not reclassified as verse
 * because it discusses the same story — that is exactly the error being fixed.
 */
import { createHash } from 'node:crypto';

export const ENGLISH_BLOCK_CLASSIFICATIONS = [
  'verse_translation',
  'prose_summary',
  'commentary',
  'heading',
  'footnote',
  'editorial_apparatus',
  'uncertain',
] as const;

export type EnglishBlockClassification =
  (typeof ENGLISH_BLOCK_CLASSIFICATIONS)[number];

/** The ONLY classification eligible as the English side of a public pairing. */
export const PAIRABLE_CLASSIFICATION = 'verse_translation' as const;

/**
 * Measured over the whole Whinfield extraction (8,004 lines): verse lines are
 * tightly clustered (p50 47, p90 56, p95 65 characters) and prose lines average
 * 571. The distribution is strongly bimodal with an empty band between roughly
 * 70 and 150, so a threshold placed inside that band separates them without
 * needing to read a single word.
 */
export const MAX_VERSE_LINE_LENGTH = 100;
export const MIN_PROSE_LINE_LENGTH = 150;

/**
 * A verse run must be long enough to be verse rather than a stray title or a
 * short footnote. Whinfield's shortest genuine verse passages run well past this.
 */
export const MIN_VERSE_RUN_LINES = 4;

/** `NOTES:` opens the apparatus; every block after it in the story is footnotes. */
const NOTES_MARKER = /^notes:?$/iu;

/** Wikisource digital-edition chrome carried into the EPUB. */
const EDITION_CHROME =
  /^(this work was published before|public domain|about this digital edition|table of contents|title page)/iu;

/** A numbered footnote body: "1. Koran xviii. 23. ..." */
const FOOTNOTE_LINE = /^\d+\.\s/u;

/** Whinfield / Bell structural headings. */
const WORK_HEADING = /^(prologue|story\s+[ivxlc]+\b|book\s+[ivxlc]+\b)/iu;

/**
 * A line ending mid-clause is verse carrying over, not a title.
 *
 * Measured over the extraction: of the 127 short lines that directly follow a
 * prose argument, 103 end in a full stop and read as section titles
 * ("Description of Love.", "The Vazir's Teaching."), while the verse that slips
 * into that position ends mid-clause ("Second causes only operate in
 * subordination to,"). Terminal punctuation is therefore the discriminator.
 */
const CLAUSE_CONTINUATION = /[,;:]$/u;

export interface EnglishSourceBlock {
  readonly sourceId: string;
  readonly sequence: number;
  readonly headingPath: readonly string[];
  readonly rawText: string;
}

export interface ClassifiedSegment {
  readonly segmentId: string;
  readonly sourceId: string;
  readonly blockSequence: number;
  readonly ordinal: number;
  readonly headingPath: readonly string[];
  readonly classification: EnglishBlockClassification;
  /** Why the classifier decided this, in structural terms. */
  readonly reason: string;
  readonly lines: readonly string[];
  readonly text: string;
  readonly textSha256: string;
  readonly lineCount: number;
  /**
   * The section title that introduces a verse run, where one is recoverable.
   * Whinfield titles his verse sections with a translation of the Persian
   * section heading, which is the strongest cross-language matching signal we
   * have. Null when the run does not follow a title.
   */
  readonly subheading: string | null;
}

type LineKind = 'prose' | 'footnote' | 'short';

function lineKind(line: string): LineKind {
  if (line.length >= MIN_PROSE_LINE_LENGTH) {
    return 'prose';
  }
  if (FOOTNOTE_LINE.test(line)) {
    return 'footnote';
  }
  return 'short';
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function nonEmptyLines(rawText: string): string[] {
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

interface Run {
  readonly kind: LineKind;
  readonly lines: string[];
}

/** Groups consecutive lines of the same kind. */
function groupRuns(lines: readonly string[]): Run[] {
  const runs: Run[] = [];
  for (const line of lines) {
    const kind = lineKind(line);
    const last = runs.at(-1);
    if (last !== undefined && last.kind === kind) {
      last.lines.push(line);
      continue;
    }
    runs.push({ kind, lines: [line] });
  }
  return runs;
}

/**
 * Whinfield's layout is: argument, section title, verse — all flattened into one
 * `<br/>`-separated block by the EPUB, with no markup separating the title from
 * the verse beneath it. The title and the verse therefore arrive as one run of
 * short lines. Peel the title back off so it cannot be published as poetry.
 *
 * Known limit, deliberately not guessed at: a title sitting BETWEEN two verse
 * sections has no prose anchor before it and no markup to find it by, so it
 * stays inside its verse run. That is a boundary imprecision within verse, not a
 * category error — the excerpt boundaries are settled downstream by review.
 */
function splitTitlesAfterProse(runs: readonly Run[]): Run[] {
  const out: Run[] = [];
  for (const [index, run] of runs.entries()) {
    const previous = runs[index - 1];
    const first = run.lines[0];
    const rest = run.lines.slice(1);
    const followsProse = previous !== undefined && previous.kind === 'prose';

    if (
      run.kind === 'short' &&
      followsProse &&
      first !== undefined &&
      !CLAUSE_CONTINUATION.test(first) &&
      rest.length >= MIN_VERSE_RUN_LINES
    ) {
      out.push(
        { kind: 'short', lines: [first] },
        { kind: 'short', lines: rest },
      );
      continue;
    }
    out.push(run);
  }
  return out;
}

export interface ClassifyOptions {
  /**
   * True when a preceding block in the same story was the `NOTES:` marker. The
   * apparatus is positional: once notes open, what follows is notes, however
   * verse-shaped its line lengths happen to be.
   */
  readonly afterNotesMarker: boolean;
}

/**
 * Classifies one extracted block into one or more segments.
 *
 * Whole-block cases (heading, `NOTES:`, chrome, footnote bodies) resolve to a
 * single segment. A story body resolves to several: the prose argument, the
 * section title, and the verse.
 */
export function classifyEnglishBlock(
  block: EnglishSourceBlock,
  options: ClassifyOptions,
): ClassifiedSegment[] {
  const lines = nonEmptyLines(block.rawText);
  if (lines.length === 0) {
    return [];
  }

  const segments: Array<Omit<ClassifiedSegment, 'segmentId' | 'ordinal'>> = [];
  const push = (
    classification: EnglishBlockClassification,
    reason: string,
    runLines: readonly string[],
    subheading: string | null = null,
  ): void => {
    const text = runLines.join('\n');
    segments.push({
      sourceId: block.sourceId,
      blockSequence: block.sequence,
      headingPath: block.headingPath,
      classification,
      reason,
      lines: runLines,
      text,
      textSha256: sha256(text),
      lineCount: runLines.length,
      subheading,
    });
  };

  const joined = lines.join(' ');

  if (lines.length === 1 && NOTES_MARKER.test(lines[0] ?? '')) {
    push('editorial_apparatus', 'Block is the NOTES apparatus marker.', lines);
    return withIds(segments);
  }

  if (EDITION_CHROME.test(joined)) {
    push(
      'editorial_apparatus',
      'Block is digital-edition chrome, not source text.',
      lines,
    );
    return withIds(segments);
  }

  if (options.afterNotesMarker) {
    push(
      'footnote',
      'Block follows the NOTES marker within the same story; the apparatus is positional.',
      lines,
    );
    return withIds(segments);
  }

  if (lines.length === 1 && WORK_HEADING.test(lines[0] ?? '')) {
    push('heading', 'Block is a single structural work heading.', lines);
    return withIds(segments);
  }

  let sawVerse = false;
  const runs = splitTitlesAfterProse(groupRuns(lines));

  for (const [index, run] of runs.entries()) {
    if (run.kind === 'prose') {
      // Whinfield's argument precedes the verse; prose after verse is comment.
      const classification = sawVerse ? 'commentary' : 'prose_summary';
      const reason = sawVerse
        ? `Prose paragraph (line length >= ${String(MIN_PROSE_LINE_LENGTH)}) following verse; editorial comment, never a translation.`
        : `Leading prose paragraph (line length >= ${String(MIN_PROSE_LINE_LENGTH)}); Whinfield's story argument, never a translation.`;
      push(classification, reason, run.lines);
      continue;
    }

    if (run.kind === 'footnote') {
      push('footnote', 'Run is numbered footnote bodies.', run.lines);
      continue;
    }

    // A short run directly after the argument, too short to be verse, is the
    // section title Whinfield puts between the argument and the verse.
    const next = runs[index + 1];
    const isTitleBeforeVerse =
      run.lines.length < MIN_VERSE_RUN_LINES &&
      next !== undefined &&
      next.kind === 'short' &&
      next.lines.length >= MIN_VERSE_RUN_LINES;

    if (isTitleBeforeVerse) {
      push(
        'heading',
        'Short run between the prose argument and a verse run; a verse-section title.',
        run.lines,
      );
      continue;
    }

    if (run.lines.length >= MIN_VERSE_RUN_LINES) {
      // The title, when present, is the run we just emitted.
      const previous = segments.at(-1);
      const subheading =
        previous !== undefined && previous.classification === 'heading'
          ? previous.lines.join(' ')
          : null;
      sawVerse = true;
      push(
        'verse_translation',
        `Run of ${String(run.lines.length)} lineated lines under ${String(MAX_VERSE_LINE_LENGTH)} characters; verse.`,
        run.lines,
        subheading,
      );
      continue;
    }

    push(
      'uncertain',
      `Short run of ${String(run.lines.length)} line(s) with no verse run adjacent; not eligible for pairing.`,
      run.lines,
    );
  }

  return withIds(segments);
}

function withIds(
  segments: readonly Omit<ClassifiedSegment, 'segmentId' | 'ordinal'>[],
): ClassifiedSegment[] {
  return segments.map((segment, ordinal) => ({
    ...segment,
    ordinal,
    segmentId: `${segment.sourceId}-b${String(segment.blockSequence).padStart(4, '0')}-s${String(ordinal)}`,
  }));
}

/**
 * Classifies a whole extraction in block order, carrying the `NOTES:` position
 * forward within each story. Deterministic: same input, same output.
 */
export function classifyEnglishBlocks(
  blocks: readonly EnglishSourceBlock[],
): ClassifiedSegment[] {
  const ordered = [...blocks].sort((a, b) => a.sequence - b.sequence);
  const out: ClassifiedSegment[] = [];
  let notesOpenFor: string | null = null;

  for (const block of ordered) {
    const story = block.headingPath[0] ?? '';
    const afterNotesMarker = notesOpenFor === story && story !== '';
    out.push(...classifyEnglishBlock(block, { afterNotesMarker }));

    const lines = nonEmptyLines(block.rawText);
    if (lines.length === 1 && NOTES_MARKER.test(lines[0] ?? '')) {
      notesOpenFor = story;
    } else if (story !== notesOpenFor) {
      notesOpenFor = null;
    }
  }

  return out;
}

/** The verse-only inventory: the only English material eligible for pairing. */
export function pairableSegments(
  segments: readonly ClassifiedSegment[],
): ClassifiedSegment[] {
  return segments.filter(
    (segment) => segment.classification === PAIRABLE_CLASSIFICATION,
  );
}
