import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { inspectPublicBundle } from '../../scripts/poetry/inspect-public-bundle';

let dist: string;

beforeEach(async () => {
  dist = await mkdtemp(join(tmpdir(), 'divan-bundle-'));
});

afterEach(async () => {
  await rm(dist, { recursive: true, force: true });
});

describe('inspectPublicBundle', () => {
  it('passes a clean bundle', async () => {
    await writeFile(join(dist, 'index.html'), '<!doctype html>');
    await mkdir(join(dist, 'assets'), { recursive: true });
    await writeFile(join(dist, 'assets', 'app.js'), 'console.log(1)');
    await writeFile(join(dist, 'release.json'), '{"items":[]}');
    const problems = await inspectPublicBundle(dist);
    expect(problems).toEqual([]);
  });

  it('flags an EPUB or PDF source book', async () => {
    await writeFile(join(dist, 'book.epub'), 'PK');
    await writeFile(join(dist, 'scan.pdf'), '%PDF');
    const problems = await inspectPublicBundle(dist);
    expect(problems.some((p) => p.file.endsWith('book.epub'))).toBe(true);
    expect(problems.some((p) => p.file.endsWith('scan.pdf'))).toBe(true);
  });

  it('flags OCR text and extracted staging JSONL', async () => {
    await writeFile(join(dist, 'hafiz_djvu.txt'), 'ocr');
    await writeFile(join(dist, 'hafez-fa.jsonl'), '{}');
    const problems = await inspectPublicBundle(dist);
    expect(problems.some((p) => p.file.endsWith('hafiz_djvu.txt'))).toBe(true);
    expect(problems.some((p) => p.file.endsWith('hafez-fa.jsonl'))).toBe(true);
  });

  it('flags leaked lock, registry and reviewer files', async () => {
    await writeFile(join(dist, 'source-lock.json'), '{}');
    await mkdir(join(dist, 'config'), { recursive: true });
    await writeFile(join(dist, 'config', 'reviewers.yaml'), 'x');
    await writeFile(join(dist, 'config', 'rights-evidence.yaml'), 'x');
    const problems = await inspectPublicBundle(dist);
    expect(problems.some((p) => p.file.endsWith('source-lock.json'))).toBe(
      true,
    );
    expect(problems.some((p) => p.file.endsWith('reviewers.yaml'))).toBe(true);
    expect(problems.some((p) => p.file.endsWith('rights-evidence.yaml'))).toBe(
      true,
    );
  });

  it('flags a file whose contents reference a private source path', async () => {
    await writeFile(
      join(dist, 'leak.js'),
      'const p = "sources-private/poetry/raw/hafez-bell-1897-en/source.txt";',
    );
    const problems = await inspectPublicBundle(dist);
    expect(problems.some((p) => p.file.endsWith('leak.js'))).toBe(true);
  });

  it('flags machine candidate reports', async () => {
    await writeFile(join(dist, 'hafez-candidates.json'), '{}');
    const problems = await inspectPublicBundle(dist);
    expect(problems.some((p) => p.file.endsWith('hafez-candidates.json'))).toBe(
      true,
    );
  });
});
