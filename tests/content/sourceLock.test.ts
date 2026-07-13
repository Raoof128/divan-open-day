import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  acquireArtifact,
  assertAllowedUrl,
  downloadArtifact,
  hashFile,
  type SourceLock,
} from '../../scripts/poetry/fetch-sources';
import { verifyLock } from '../../scripts/poetry/verify-source-lock';

type MockHeaders = Record<string, string>;

interface MockStep {
  status: number;
  headers?: MockHeaders;
  chunks?: Uint8Array[];
}

function textChunk(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

const EPUB_MAGIC = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // "PK.."

function epubBody(): Uint8Array[] {
  return [EPUB_MAGIC, textChunk('rest-of-zip-bytes')];
}

function makeResponse(step: MockStep) {
  const headers = new Map(
    Object.entries(step.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const chunks = step.chunks ?? [];
  return {
    status: step.status,
    headers: {
      get: (name: string): string | null =>
        headers.get(name.toLowerCase()) ?? null,
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    body: (async function* () {
      for (const chunk of chunks) {
        yield chunk;
      }
    })(),
  };
}

/** Returns a fetch mock that plays back a scripted sequence of responses. */
function scriptedFetch(steps: MockStep[]) {
  let index = 0;
  const calls: string[] = [];
  const fetchImpl = (url: string) => {
    calls.push(url);
    const step = steps[index];
    index += 1;
    if (step === undefined) {
      throw new Error(`Unexpected extra fetch for ${url}`);
    }
    return Promise.resolve(makeResponse(step));
  };
  return { fetchImpl, calls };
}

const EPUB_ARTIFACT = {
  kind: 'epub' as const,
  url: 'https://ws-export.wmcloud.org/?format=epub&lang=fa&page=X',
  required: true,
  max_bytes: 10_000_000,
};

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'divan-src-lock-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('assertAllowedUrl', () => {
  it('accepts allowlisted HTTPS hosts', () => {
    expect(() =>
      assertAllowedUrl('https://archive.org/download/x/y.txt'),
    ).not.toThrow();
  });

  it('rejects plain HTTP', () => {
    expect(() => assertAllowedUrl('http://archive.org/x')).toThrow();
  });

  it('rejects non-allowlisted hosts', () => {
    expect(() => assertAllowedUrl('https://evil.example.com/x')).toThrow();
  });
});

describe('downloadArtifact', () => {
  it('streams an allowlisted EPUB and records sha256, bytes and content type', async () => {
    const dest = join(dir, 'source.epub');
    const { fetchImpl } = scriptedFetch([
      {
        status: 200,
        headers: { 'content-type': 'application/epub+zip' },
        chunks: epubBody(),
      },
    ]);
    const result = await downloadArtifact({
      artifact: EPUB_ARTIFACT,
      destPath: dest,
      fetchImpl,
    });
    const expectedBytes = Buffer.concat(epubBody().map((c) => Buffer.from(c)));
    expect(result.bytes).toBe(expectedBytes.length);
    expect(result.sha256).toBe(
      createHash('sha256').update(expectedBytes).digest('hex'),
    );
    expect(result.content_type).toBe('application/epub+zip');
    expect(existsSync(dest)).toBe(true);
    expect(existsSync(`${dest}.partial`)).toBe(false);
  });

  it('follows an allowlisted redirect but rejects an off-host redirect', async () => {
    const dest = join(dir, 'source.epub');
    const offHost = scriptedFetch([
      { status: 302, headers: { location: 'https://evil.example.com/x.epub' } },
    ]);
    await expect(
      downloadArtifact({
        artifact: EPUB_ARTIFACT,
        destPath: dest,
        fetchImpl: offHost.fetchImpl,
      }),
    ).rejects.toThrow(/host/i);
    expect(existsSync(`${dest}.partial`)).toBe(false);

    const onHost = scriptedFetch([
      {
        status: 301,
        headers: {
          location: 'https://ws-export.wmcloud.org/final?format=epub',
        },
      },
      {
        status: 200,
        headers: { 'content-type': 'application/epub+zip' },
        chunks: epubBody(),
      },
    ]);
    const result = await downloadArtifact({
      artifact: EPUB_ARTIFACT,
      destPath: dest,
      fetchImpl: onHost.fetchImpl,
    });
    expect(result.final_url).toBe(
      'https://ws-export.wmcloud.org/final?format=epub',
    );
  });

  it('fails and cleans up when the response exceeds max_bytes', async () => {
    const dest = join(dir, 'source.epub');
    const { fetchImpl } = scriptedFetch([
      {
        status: 200,
        headers: { 'content-type': 'application/epub+zip' },
        chunks: [EPUB_MAGIC, textChunk('x'.repeat(5_000))],
      },
    ]);
    await expect(
      downloadArtifact({
        artifact: { ...EPUB_ARTIFACT, max_bytes: 100 },
        destPath: dest,
        fetchImpl,
      }),
    ).rejects.toThrow(/max_bytes|too large|size/i);
    expect(existsSync(dest)).toBe(false);
    expect(existsSync(`${dest}.partial`)).toBe(false);
  });

  it('rejects HTML returned in place of an expected EPUB', async () => {
    const dest = join(dir, 'source.epub');
    const { fetchImpl } = scriptedFetch([
      {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        chunks: [
          textChunk('<!DOCTYPE html><html><body>Not an EPUB</body></html>'),
        ],
      },
    ]);
    await expect(
      downloadArtifact({ artifact: EPUB_ARTIFACT, destPath: dest, fetchImpl }),
    ).rejects.toThrow(/html|content type|epub/i);
    expect(existsSync(dest)).toBe(false);
    expect(existsSync(`${dest}.partial`)).toBe(false);
  });

  it('rejects a non-2xx, non-redirect status', async () => {
    const dest = join(dir, 'source.epub');
    const { fetchImpl } = scriptedFetch([{ status: 404 }]);
    await expect(
      downloadArtifact({ artifact: EPUB_ARTIFACT, destPath: dest, fetchImpl }),
    ).rejects.toThrow(/404|status/i);
  });
});

describe('acquireArtifact (lock reconciliation)', () => {
  it('does not re-download when the existing file matches the locked hash', async () => {
    const dest = join(dir, 'source.epub');
    const bytes = Buffer.concat(epubBody().map((c) => Buffer.from(c)));
    await writeFile(dest, bytes);
    const sha = await hashFile(dest);
    let called = false;
    const result = await acquireArtifact({
      artifact: EPUB_ARTIFACT,
      destPath: dest,
      existingSha: sha,
      fetchImpl: () => {
        called = true;
        throw new Error('should not fetch');
      },
    });
    expect(called).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.sha256).toBe(sha);
  });

  it('fails loudly when the existing file does not match the locked hash', async () => {
    const dest = join(dir, 'source.epub');
    await writeFile(dest, 'tampered');
    await expect(
      acquireArtifact({
        artifact: EPUB_ARTIFACT,
        destPath: dest,
        existingSha: 'a'.repeat(64),
        fetchImpl: () => {
          throw new Error('should not fetch');
        },
      }),
    ).rejects.toThrow(/hash|mismatch|lock/i);
  });
});

describe('verifyLock', () => {
  const lock: SourceLock = {
    schema_version: 1,
    generated_at: '2026-07-14T00:00:00.000Z',
    entries: [
      {
        source_id: 'hafez-bell-1897-en',
        artifact_kind: 'text',
        file: 'raw/hafez-bell-1897-en/source.txt',
        requested_url: 'https://archive.org/download/x/y_djvu.txt',
        final_url: 'https://archive.org/download/x/y_djvu.txt',
        sha256: 'b'.repeat(64),
        bytes: 1234,
        content_type: 'text/plain',
        retrieved_at: '2026-07-14T00:00:00.000Z',
      },
    ],
  };

  it('reports no problems when every file matches', async () => {
    const problems = await verifyLock(lock, {
      fileExists: () => true,
      hashOf: () => Promise.resolve('b'.repeat(64)),
    });
    expect(problems).toEqual([]);
  });

  it('reports a missing file', async () => {
    const problems = await verifyLock(lock, {
      fileExists: () => false,
      hashOf: () => Promise.resolve('b'.repeat(64)),
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.reason).toMatch(/missing/i);
  });

  it('reports a tampered file', async () => {
    const problems = await verifyLock(lock, {
      fileExists: () => true,
      hashOf: () => Promise.resolve('c'.repeat(64)),
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.reason).toMatch(/mismatch/i);
  });
});
