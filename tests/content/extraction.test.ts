import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const EXTRACTOR = resolve(process.cwd(), 'scripts/poetry/extract-epub.py');
const FIXTURE_BUILDER = resolve(
  process.cwd(),
  'tests/fixtures/poetry/build-fixture-epub.py',
);

interface ExtractedBlock {
  sourceId: string;
  documentPath: string;
  sequence: number;
  headingPath: string[];
  rawText: string;
  searchText: string;
  rawTextSha256: string;
}

function runExtractor(input: string, output: string, sourceId: string): void {
  execFileSync(
    'python3',
    [EXTRACTOR, '--source-id', sourceId, '--input', input, '--output', output],
    { stdio: 'pipe' },
  );
}

async function readBlocks(output: string): Promise<ExtractedBlock[]> {
  const text = await readFile(output, 'utf8');
  return text
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as ExtractedBlock);
}

let dir: string;
let epub: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'divan-extract-'));
  epub = join(dir, 'fixture.epub');
  execFileSync('python3', [FIXTURE_BUILDER, epub], { stdio: 'pipe' });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('extract-epub.py', () => {
  it('preserves spine order and heading context', async () => {
    const out = join(dir, 'out.jsonl');
    runExtractor(epub, out, 'fixture-src');
    const blocks = await readBlocks(out);

    // Spine order: chap1 blocks precede chap2 blocks; sequence is monotonic.
    const chap1 = blocks.filter((b) => b.documentPath.endsWith('chap1.xhtml'));
    const chap2 = blocks.filter((b) => b.documentPath.endsWith('chap2.xhtml'));
    expect(chap1.length).toBeGreaterThan(0);
    expect(chap2.length).toBeGreaterThan(0);
    expect(Math.max(...chap1.map((b) => b.sequence))).toBeLessThan(
      Math.min(...chap2.map((b) => b.sequence)),
    );
    expect(blocks.map((b) => b.sequence)).toEqual(
      blocks.map((_, index) => index),
    );

    // Heading context flows into headingPath.
    const englishBlock = blocks.find((b) =>
      b.rawText.includes('English block'),
    );
    expect(englishBlock?.headingPath).toEqual(['Book Two', 'A Section']);
    const persianBlock = blocks.find((b) => b.headingPath[0] === 'Book One');
    expect(persianBlock).toBeDefined();
  });

  it('excludes script and style text', async () => {
    const out = join(dir, 'out.jsonl');
    runExtractor(epub, out, 'fixture-src');
    const blocks = await readBlocks(out);
    const allRaw = blocks.map((b) => b.rawText).join('\n');
    expect(allRaw).not.toContain('font-family');
    expect(allRaw).not.toContain('console.log');
  });

  it('keeps Persian raw text Persian and preserves ZWNJ', async () => {
    const out = join(dir, 'out.jsonl');
    runExtractor(epub, out, 'fixture-src');
    const blocks = await readBlocks(out);
    const persian = blocks.find((b) => /[؀-ۿ]/u.test(b.rawText));
    expect(persian).toBeDefined();
    // ZWNJ (U+200C) is meaningful and preserved in rawText.
    expect(persian?.rawText).toContain('‌');
    // Arabic Yeh (U+064A) present in the raw source.
    expect(persian?.rawText).toContain('ي');
  });

  it('normalises search text without rewriting raw text', async () => {
    const out = join(dir, 'out.jsonl');
    runExtractor(epub, out, 'fixture-src');
    const blocks = await readBlocks(out);
    const persian = blocks.find((b) => /[؀-ۿ]/u.test(b.rawText));
    // searchText folds Arabic Yeh -> Persian Yeh and strips ZWNJ.
    expect(persian?.searchText).not.toContain('‌');
    expect(persian?.searchText).not.toContain('ي');
    expect(persian?.searchText).toContain('ی'); // Persian Yeh
  });

  it('records a sha256 of the raw text', async () => {
    const out = join(dir, 'out.jsonl');
    runExtractor(epub, out, 'fixture-src');
    const blocks = await readBlocks(out);
    for (const block of blocks) {
      expect(block.rawTextSha256).toBe(
        createHash('sha256').update(block.rawText, 'utf8').digest('hex'),
      );
    }
  });

  it('refuses an EPUB whose XML declares a DOCTYPE/ENTITY (XXE guard)', () => {
    const malicious = join(dir, 'malicious.epub');
    execFileSync('python3', [FIXTURE_BUILDER, malicious, '--malicious'], {
      stdio: 'pipe',
    });
    const out = join(dir, 'out.jsonl');
    expect(() => runExtractor(malicious, out, 'fixture-src')).toThrow();
  });

  it('is deterministic: identical bytes on replay', async () => {
    const first = join(dir, 'first.jsonl');
    const second = join(dir, 'second.jsonl');
    runExtractor(epub, first, 'fixture-src');
    runExtractor(epub, second, 'fixture-src');
    const [a, b] = await Promise.all([
      readFile(first, 'utf8'),
      readFile(second, 'utf8'),
    ]);
    expect(a).toBe(b);
  });
});
