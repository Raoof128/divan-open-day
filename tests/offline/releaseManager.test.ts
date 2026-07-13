import { webcrypto } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  POINTER_CACHE_NAME,
  RELEASE_CACHE_PREFIX,
  RELEASE_POINTER_PATH,
  READY_PATH,
  OfflineReleaseManager,
} from '../../src-sw/releaseManager';
import {
  FakeCacheStorage,
  canonicalStringify,
  fetchFrom,
  jsonResponse,
  redirected,
  releaseFixture,
  sha256,
} from './helpers';

function manager(
  fixture = releaseFixture(),
  caches = new FakeCacheStorage(),
  fetchImplementation = fetchFrom(fixture.files),
) {
  return {
    caches,
    fixture,
    subject: new OfflineReleaseManager({
      caches,
      fetch: fetchImplementation,
      crypto: webcrypto,
      origin: 'https://divan.test',
    }),
  };
}

describe('atomic release staging', () => {
  it('stages and marks a fully verified release without activating it or precaching audio', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const fixture = releaseFixture();
    const { caches, subject } = manager(
      fixture,
      new FakeCacheStorage(),
      fetchFrom(fixture.files, calls),
    );

    const result = await subject.stageCurrentRelease();

    expect(result).toEqual({ status: 'ready', releaseId: 'release-one' });
    const candidate = await caches.open(`${RELEASE_CACHE_PREFIX}release-one`);
    expect(await candidate.match(READY_PATH)).toBeDefined();
    expect(await candidate.match('/index.html')).toBeDefined();
    expect(await candidate.match('/assets/app-0123456789abcdef.js')).toBeDefined();
    expect(await candidate.match('/audio/sample.mp3')).toBeUndefined();
    expect(caches.stores.has(POINTER_CACHE_NAME)).toBe(true);
    await expect(subject.activePointer()).resolves.toBeNull();
    await expect(subject.pendingReleaseId()).resolves.toBe('release-one');
    expect(calls.every(({ init }) => init?.cache === 'no-store')).toBe(true);
    expect(calls.every(({ init }) => init?.credentials === 'same-origin')).toBe(true);
    expect(calls.every(({ init }) => init?.redirect === 'error')).toBe(true);
  });

  it.each([
    ['response failure', () => new Response('no', { status: 503 })],
    ['redirect', () => redirected(jsonResponse(releaseFixture().release))],
    ['malformed exact metadata', () => jsonResponse({ ...releaseFixture().release, extra: true })],
  ])('cleans only the candidate on %s', async (_name, releaseResponse) => {
    const fixture = releaseFixture();
    const files = new Map(fixture.files);
    files.set('/release.json', releaseResponse());
    const caches = new FakeCacheStorage();
    const active = await caches.open(`${RELEASE_CACHE_PREFIX}old-release`);
    await active.put(READY_PATH, jsonResponse({ releaseId: 'old-release' }));
    const pointer = await caches.open(POINTER_CACHE_NAME);
    await pointer.put(
      RELEASE_POINTER_PATH,
      jsonResponse({ activeReleaseId: 'old-release', previousReleaseId: null }),
    );
    const subject = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(files),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });

    await expect(subject.stageCurrentRelease()).rejects.toThrow();
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}old-release`)).toBe(true);
    expect(await pointer.match(RELEASE_POINTER_PATH)).toBeDefined();
  });

  it('rejects a canonical item-hash mismatch even when the corpus digest is coherent', async () => {
    const fixture = releaseFixture();
    const corpus = structuredClone(fixture.corpus) as {
      items: { contentHash: string }[];
      releaseId: string;
      schemaVersion: number;
    };
    corpus.items[0]!.contentHash = 'a'.repeat(64);
    const corpusText = canonicalStringify(corpus);
    const digest = sha256(corpusText);
    const release = {
      ...fixture.release,
      contentPath: `/content/${digest}.json`,
      contentSha256: digest,
    };
    const files = new Map(fixture.files);
    files.set('/release.json', jsonResponse(release));
    files.set(release.contentPath, new Response(corpusText));
    const { caches, subject } = manager(fixture, new FakeCacheStorage(), fetchFrom(files));

    await expect(subject.stageCurrentRelease()).rejects.toThrow();
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-one`)).toBe(false);
  });

  it('rejects hostile audio precaching before any audio fetch', async () => {
    const fixture = releaseFixture();
    const manifest = structuredClone(fixture.manifest) as {
      assets: { path: string; requiredOffline: boolean }[];
      releaseId: string;
    };
    manifest.assets.find(({ path }) => path.startsWith('audio/'))!.requiredOffline = true;
    const manifestText = canonicalStringify(manifest);
    const digest = sha256(manifestText);
    const release = {
      ...fixture.release,
      assetManifestPath: `/assets/${digest}.json`,
      assetManifestSha256: digest,
    };
    const files = new Map(fixture.files);
    files.set('/release.json', jsonResponse(release));
    files.set(release.assetManifestPath, new Response(manifestText));
    const calls: { path: string; init?: RequestInit }[] = [];
    const { subject } = manager(
      fixture,
      new FakeCacheStorage(),
      fetchFrom(files, calls),
    );

    await expect(subject.stageCurrentRelease()).rejects.toThrow();
    expect(calls.some(({ path }) => path.startsWith('/audio/'))).toBe(false);
  });

  it('enforces the 8 MB complete offline-release ceiling', async () => {
    const fixture = releaseFixture();
    const manifest = structuredClone(fixture.manifest) as {
      assets: Record<string, unknown>[];
      releaseId: string;
    };
    const files = new Map(fixture.files);
    for (const marker of ['a', 'b']) {
      const bytes = new TextEncoder().encode(marker.repeat(4_000_000));
      const digest = sha256(bytes);
      const path = `images/large-${marker}-${digest.slice(0, 8)}.png`;
      manifest.assets.push({
        path,
        mimeType: 'image/png',
        sha256: digest,
        bytes: bytes.byteLength,
        requiredOffline: true,
      });
      files.set(`/${path}`, new Response(bytes));
    }
    const manifestText = canonicalStringify(manifest);
    const manifestDigest = sha256(manifestText);
    const release = {
      ...fixture.release,
      assetManifestPath: `/assets/${manifestDigest}.json`,
      assetManifestSha256: manifestDigest,
    };
    files.set('/release.json', jsonResponse(release));
    files.set(release.assetManifestPath, new Response(manifestText));
    const { caches, subject } = manager(fixture, new FakeCacheStorage(), fetchFrom(files));

    await expect(subject.stageCurrentRelease()).rejects.toThrow(/staging/iu);
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-one`)).toBe(false);
  });

  it('rejects reuse of a ready release ID with changed public metadata', async () => {
    const fixture = releaseFixture();
    const files = new Map(fixture.files);
    const { subject } = manager(fixture, new FakeCacheStorage(), fetchFrom(files));
    await subject.stageCurrentRelease();
    files.set(
      '/release.json',
      jsonResponse({
        ...fixture.release,
        builtAt: '2026-07-13T00:00:01.000Z',
      }),
    );

    await expect(subject.stageCurrentRelease()).rejects.toThrow(/reused|reuse/iu);
  });

  it('preserves active and previous rollback caches when a previous ID is reused with changed metadata', async () => {
    const caches = new FakeCacheStorage();
    const first = manager(releaseFixture('release-one'), caches).subject;
    await first.stageCurrentRelease();
    await first.activateRelease('release-one');
    const second = manager(releaseFixture('release-two'), caches).subject;
    await second.stageCurrentRelease();
    await second.activateRelease('release-two');
    const reused = releaseFixture('release-one');
    const files = new Map(reused.files);
    files.set(
      '/release.json',
      jsonResponse({
        ...reused.release,
        builtAt: '2026-07-13T00:00:01.000Z',
      }),
    );
    const subject = manager(reused, caches, fetchFrom(files)).subject;

    await expect(subject.stageCurrentRelease()).rejects.toThrow(/reuse|rollback/iu);

    expect(await subject.activePointer()).toEqual({
      activeReleaseId: 'release-two',
      previousReleaseId: 'release-one',
    });
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-two`)).toBe(true);
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-one`)).toBe(true);
  });

  it('accepts decoded bytes with a compressed wire length and sanitizes reconstructed headers', async () => {
    const fixture = releaseFixture();
    const files = new Map(fixture.files);
    files.set(
      '/index.html',
      new Response('<!doctype html><title>DIVAN</title>', {
        headers: {
          'content-encoding': 'gzip',
          'content-length': '17',
          'content-security-policy': "default-src 'self'",
          'content-type': 'text/html; charset=utf-8',
          'transfer-encoding': 'chunked',
          vary: 'accept-encoding',
        },
      }),
    );
    const { caches, subject } = manager(
      fixture,
      new FakeCacheStorage(),
      fetchFrom(files),
    );

    await expect(subject.stageCurrentRelease()).resolves.toEqual({
      status: 'ready',
      releaseId: 'release-one',
    });

    const candidate = await caches.open(`${RELEASE_CACHE_PREFIX}release-one`);
    const reconstructed = await candidate.match('/index.html');
    expect(reconstructed).toBeDefined();
    await expect(reconstructed?.text()).resolves.toBe(
      '<!doctype html><title>DIVAN</title>',
    );
    expect(reconstructed?.headers.get('content-encoding')).toBeNull();
    expect(reconstructed?.headers.get('content-length')).toBeNull();
    expect(reconstructed?.headers.get('transfer-encoding')).toBeNull();
    expect(reconstructed?.headers.get('vary')).toBeNull();
    expect(reconstructed?.headers.get('content-security-policy')).toBe(
      "default-src 'self'",
    );
  });

  it('rejects a partial required response before CacheStorage sees it', async () => {
    const fixture = releaseFixture();
    const files = new Map(fixture.files);
    files.set(
      '/index.html',
      new Response('<!doctype html><title>DIVAN</title>', {
        status: 206,
        headers: {
          'content-range': 'bytes 0-39/40',
          'content-type': 'text/html; charset=utf-8',
        },
      }),
    );
    const caches = new FakeCacheStorage();
    const { subject } = manager(fixture, caches, fetchFrom(files));

    await expect(subject.stageCurrentRelease()).rejects.toThrow(/staging/iu);

    expect(caches.rejectedPartialPutAttempts).toBe(0);
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-one`)).toBe(false);
  });

  it.each([
    ['wrong counts', (fixture: ReturnType<typeof releaseFixture>) => ({ ...fixture.release, itemCount: 3 })],
    ['wrong content path', (fixture: ReturnType<typeof releaseFixture>) => ({ ...fixture.release, contentPath: `/content/${'a'.repeat(64)}.json` })],
    ['wrong corpus release ID', (fixture: ReturnType<typeof releaseFixture>) => ({ ...fixture.corpus, releaseId: 'another-release' })],
    ['duplicate corpus IDs', (fixture: ReturnType<typeof releaseFixture>) => ({ ...fixture.corpus, items: [{ id: 'same', poet: 'hafez' }, { id: 'same', poet: 'rumi' }] })],
  ])('rejects %s and removes its candidate', async (_name, mutate) => {
    const fixture = releaseFixture();
    const files = new Map(fixture.files);
    const changed = mutate(fixture);
    if ('contentPath' in changed || 'itemCount' in changed) {
      files.set('/release.json', jsonResponse(changed));
    } else {
      const text = canonicalStringify(changed);
      const digest = sha256(text);
      const release = { ...fixture.release, contentPath: `/content/${digest}.json`, contentSha256: digest };
      files.set('/release.json', jsonResponse(release));
      files.set(release.contentPath, new Response(text));
    }
    const { caches, subject } = manager(fixture, new FakeCacheStorage(), fetchFrom(files));

    await expect(subject.stageCurrentRelease()).rejects.toThrow();
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-one`)).toBe(false);
  });

  it.each(['corpus', 'manifest', 'asset'] as const)('rejects a %s SHA mismatch', async (kind) => {
    const fixture = releaseFixture();
    const files = new Map(fixture.files);
    const path =
      kind === 'corpus'
        ? String(fixture.release['contentPath'])
        : kind === 'manifest'
          ? String(fixture.release['assetManifestPath'])
          : '/index.html';
    files.set(path, new Response('tampered'));
    const { caches, subject } = manager(fixture, new FakeCacheStorage(), fetchFrom(files));

    await expect(subject.stageCurrentRelease()).rejects.toThrow();
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-one`)).toBe(false);
  });

  it.each([
    ['missing asset', () => new Response('missing', { status: 404 })],
    ['oversized response', () => new Response('x'.repeat(100))],
  ])('rejects a %s while preserving the active release', async (_name, replacement) => {
    const fixture = releaseFixture();
    const manifest = structuredClone(fixture.manifest) as { assets: { path: string; bytes: number; sha256: string }[]; releaseId: string };
    const index = manifest.assets.find(({ path }) => path === 'index.html')!;
    if (_name === 'oversized response') {
      index.bytes = 10;
      index.sha256 = sha256('x'.repeat(10));
    }
    const manifestText = canonicalStringify(manifest);
    const manifestDigest = sha256(manifestText);
    const release = {
      ...fixture.release,
      assetManifestPath: `/assets/${manifestDigest}.json`,
      assetManifestSha256: manifestDigest,
    };
    const files = new Map(fixture.files);
    files.set('/release.json', jsonResponse(release));
    files.set(release.assetManifestPath, new Response(manifestText));
    files.set('/index.html', replacement());
    const { caches, subject } = manager(fixture, new FakeCacheStorage(), fetchFrom(files));

    await expect(subject.stageCurrentRelease()).rejects.toThrow();
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-one`)).toBe(false);
  });
});

describe('atomic activation', () => {
  it('defers updates, then atomically retains active plus exactly one previous release', async () => {
    const caches = new FakeCacheStorage();
    const first = manager(releaseFixture('release-one'), caches).subject;
    await first.stageCurrentRelease();
    await first.activateRelease('release-one');
    const second = manager(releaseFixture('release-two'), caches).subject;
    await second.stageCurrentRelease();
    await second.activateRelease('release-two');
    const subject = manager(releaseFixture('release-three'), caches).subject;
    await subject.stageCurrentRelease();
    expect(await subject.activePointer()).toEqual({
      activeReleaseId: 'release-two',
      previousReleaseId: 'release-one',
    });

    await subject.activateRelease('release-three');

    expect(await subject.activePointer()).toEqual({
      activeReleaseId: 'release-three',
      previousReleaseId: 'release-two',
    });
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-one`)).toBe(false);
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-two`)).toBe(true);
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-three`)).toBe(true);
  });

  it('leaves pointer and complete caches untouched when the atomic pointer write fails', async () => {
    const caches = new FakeCacheStorage();
    const first = manager(releaseFixture('release-one'), caches).subject;
    await first.stageCurrentRelease();
    await first.activateRelease('release-one');
    const second = manager(releaseFixture('release-two'), caches).subject;
    await second.stageCurrentRelease();
    const pointer = await caches.open(POINTER_CACHE_NAME);
    vi.spyOn(pointer, 'put').mockRejectedValueOnce(new Error('simulated pointer failure'));

    await expect(second.activateRelease('release-two')).rejects.toThrow();
    expect(await second.activePointer()).toEqual({
      activeReleaseId: 'release-one',
      previousReleaseId: null,
    });
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-one`)).toBe(true);
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-two`)).toBe(true);
  });

  it('refuses to activate an incomplete candidate', async () => {
    const { caches, subject } = manager();
    await caches.open(`${RELEASE_CACHE_PREFIX}release-one`);

    await expect(subject.activateRelease('release-one')).rejects.toThrow(/complete|ready/iu);
    expect(await subject.activePointer()).toBeNull();
  });
});
