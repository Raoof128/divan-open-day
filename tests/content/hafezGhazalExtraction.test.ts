import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Regression suite for the defect recorded in
 * docs/audits/divan/2026-07-15-hafez-verse-recovery.md: the entire Persian
 * Divan was missing from staging.
 *
 * `extract-epub.py` harvests block tags (p, h1-h6, li, blockquote). The
 * Qazvini-Ghani edition sets every ghazal as a table — hemistichs in
 * `<span class="beyt">` inside `<td>` — so all 486 ghazals were silently
 * dropped while the footnote apparatus, which is in `<p>`, came through intact.
 * Hafez then scored zero candidates for the life of the project, and it was read
 * as a matching failure rather than an empty corpus.
 *
 * These tests pin the recovery and the three real source defects it must
 * survive. The source is private and git-ignored; the fixture reproduces the
 * markup shape with TEST ONLY sentinels, never poetry.
 */

const EXTRACTOR = resolve(
  process.cwd(),
  'scripts/poetry/extract-hafez-ghazals.py',
);
const BLOCK_EXTRACTOR = resolve(
  process.cwd(),
  'scripts/poetry/extract-epub.py',
);
const FIXTURE_BUILDER = resolve(
  process.cwd(),
  'tests/fixtures/poetry/build-ghazal-fixture-epub.py',
);

interface Ghazal {
  sourceId: string;
  documentPath: string;
  sequence: number;
  ghazalNumber: number;
  title: string | null;
  hemistichs: string[];
  coupletCount: number;
  rawText: string;
  searchText: string;
  rawTextSha256: string;
  numberAmbiguous: boolean;
}

function runExtractor(input: string, output: string): void {
  execFileSync(
    'python3',
    [
      EXTRACTOR,
      '--source-id',
      'fixture-hafez',
      '--input',
      input,
      '--output',
      output,
    ],
    { stdio: 'pipe' },
  );
}

async function readGhazals(output: string): Promise<Ghazal[]> {
  const text = await readFile(output, 'utf8');
  return text
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as Ghazal);
}

let dir: string;
let epub: string;
let out: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'divan-ghazal-'));
  epub = join(dir, 'fixture.epub');
  out = join(dir, 'out.jsonl');
  execFileSync('python3', [FIXTURE_BUILDER, epub], { stdio: 'pipe' });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('extract-hafez-ghazals.py', () => {
  it('recovers verse that the block extractor drops entirely', async () => {
    // The defect itself: prove the original extractor sees no verse in this
    // markup, so the ghazal reader is load-bearing rather than a nicety.
    const blockOut = join(dir, 'blocks.jsonl');
    execFileSync(
      'python3',
      [
        BLOCK_EXTRACTOR,
        '--source-id',
        'fixture-hafez',
        '--input',
        epub,
        '--output',
        blockOut,
      ],
      { stdio: 'pipe' },
    );
    const blockText = await readFile(blockOut, 'utf8');
    expect(blockText).not.toContain('سطر آزمایشی یکم');
    // ...and that it captures the footnote apparatus, which is what actually
    // reached staging and was mistaken for the whole source.
    expect(blockText).toContain('EDITORIAL FOOTNOTE');

    runExtractor(epub, out);
    const ghazals = await readGhazals(out);
    expect(ghazals.flatMap((g) => g.hemistichs)).toContain(
      'سطر آزمایشی یکم NOT POETRY',
    );
  });

  it('reads each ghazal number from the source, not from file order', async () => {
    runExtractor(epub, out);
    const ghazals = await readGhazals(out);
    const first = ghazals.find((g) => g.documentPath.endsWith('g1.xhtml'));
    expect(first?.ghazalNumber).toBe(1);
    expect(first?.coupletCount).toBe(3);
    expect(first?.hemistichs).toHaveLength(6);
  });

  it('never mistakes the printed page number for the ghazal number', async () => {
    // Both numbers use the same small font and differ only by cell alignment.
    // The fixture pages (۱۰, ۱۲, ۱۴) must never appear as ghazal numbers.
    runExtractor(epub, out);
    const ghazals = await readGhazals(out);
    expect(ghazals.map((g) => g.ghazalNumber)).not.toContain(10);
    expect(ghazals.map((g) => g.ghazalNumber)).not.toContain(12);
    expect(ghazals.map((g) => g.ghazalNumber)).not.toContain(14);
  });

  it('excludes the footnote apparatus from the verse', async () => {
    runExtractor(epub, out);
    const ghazals = await readGhazals(out);
    const allVerse = ghazals.flatMap((g) => g.hemistichs).join('\n');
    expect(allVerse).not.toContain('EDITORIAL FOOTNOTE');
    expect(allVerse).not.toContain('↑');
  });

  it('reads a document listed twice in the spine exactly once', async () => {
    // The real EPUB's spine lists ghazal documents twice; per-spine-entry
    // reading emitted byte-identical duplicates under one ghazal number.
    runExtractor(epub, out);
    const ghazals = await readGhazals(out);
    const g1 = ghazals.filter((g) => g.documentPath.endsWith('g1.xhtml'));
    expect(g1).toHaveLength(1);
  });

  it('flags a number the source gives to two poems rather than renumbering', async () => {
    // The real source numbers c127 and c128 both ۱۲۳. File order hints the
    // second "should" be 124, and 124 is otherwise absent — but acting on that
    // hint would invent a poem number. Both sides must be flagged instead.
    runExtractor(epub, out);
    const ghazals = await readGhazals(out);
    const collided = ghazals.filter((g) => g.ghazalNumber === 2);
    expect(collided).toHaveLength(2);
    expect(collided.every((g) => g.numberAmbiguous)).toBe(true);
    // The unambiguous ghazal is untouched by its neighbour's defect.
    const clean = ghazals.find((g) => g.ghazalNumber === 1);
    expect(clean?.numberAmbiguous).toBe(false);
    // Nothing was silently renumbered to fill the gap.
    expect(ghazals.map((g) => g.ghazalNumber)).not.toContain(3);
  });

  it('skips poem sections that carry no ghazal number', async () => {
    // Qasidas, masnavis and quatrains are real verse but cannot be cited by
    // ghazal number, so they must not be emitted as ghazals.
    runExtractor(epub, out);
    const ghazals = await readGhazals(out);
    const allVerse = ghazals.flatMap((g) => g.hemistichs).join('\n');
    expect(allVerse).not.toContain('سطر آزمایشی نهم');
  });

  it('preserves ZWNJ and Arabic Yeh in raw text but folds them for search', async () => {
    runExtractor(epub, out);
    const ghazals = await readGhazals(out);
    const two = ghazals.find((g) => g.documentPath.endsWith('g2.xhtml'));
    expect(two?.rawText).toContain('‌'); // ZWNJ preserved
    expect(two?.rawText).toContain('ي'); // Arabic Yeh preserved
    expect(two?.searchText).not.toContain('‌');
    expect(two?.searchText).not.toContain('ي');
    expect(two?.searchText).toContain('ی');
  });

  it('records a sha256 of the raw verse', async () => {
    runExtractor(epub, out);
    const ghazals = await readGhazals(out);
    for (const ghazal of ghazals) {
      expect(ghazal.rawTextSha256).toBe(
        createHash('sha256').update(ghazal.rawText, 'utf8').digest('hex'),
      );
    }
  });

  it('is deterministic: identical bytes on replay', async () => {
    const second = join(dir, 'second.jsonl');
    runExtractor(epub, out);
    runExtractor(epub, second);
    const [a, b] = await Promise.all([
      readFile(out, 'utf8'),
      readFile(second, 'utf8'),
    ]);
    expect(a).toBe(b);
  });
});
