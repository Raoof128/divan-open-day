import { webcrypto } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  OfflineReleaseManager,
  RELEASE_CACHE_PREFIX,
  type TimeoutAdapter,
} from '../../src-sw/releaseManager';
import { FakeCacheStorage, fetchFrom, releaseFixture } from './helpers';

async function activeManager(
  fetchImplementation?: typeof fetch,
  timers?: TimeoutAdapter,
) {
  const fixture = releaseFixture();
  const caches = new FakeCacheStorage();
  const subject = new OfflineReleaseManager({
    caches,
    fetch: fetchImplementation ?? fetchFrom(fixture.files),
    crypto: webcrypto,
    origin: 'https://divan.test',
    navigationTimeoutMs: 10,
    ...(timers === undefined ? {} : { timers }),
  });
  await subject.stageCurrentRelease();
  await subject.activateRelease('release-one');
  return { subject, caches, fixture };
}

describe('release-coherent runtime strategies', () => {
  it('serves hashed assets only from the active complete release, never another candidate', async () => {
    const { subject, caches } = await activeManager();
    const candidate = await caches.open(`${RELEASE_CACHE_PREFIX}release-two`);
    await candidate.put('/assets/app-0123456789abcdef.js', new Response('wrong release'));

    const response = await subject.respond(
      new Request('https://divan.test/assets/app-0123456789abcdef.js'),
    );

    await expect(response.text()).resolves.toBe('console.log("DIVAN")');
  });

  it('uses the active cached index after a bounded navigation timeout', async () => {
    const fixture = releaseFixture();
    const hangingFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(
        typeof input === 'string' ? input : input instanceof URL ? input : input.url,
        'https://divan.test',
      ).pathname;
      if (path === '/') {
        return new Promise<Response>(() => undefined);
      }
      return fetchFrom(fixture.files)(input, init);
    }) as typeof fetch;
    const timers: TimeoutAdapter = {
      set(callback) {
        queueMicrotask(callback);
        return 1;
      },
      clear() {},
    };
    const { subject } = await activeManager(hangingFetch, timers);

    const response = await subject.respond(
      new Request('https://divan.test/', { headers: { accept: 'text/html' } }),
    );

    await expect(response.text()).resolves.toContain('<title>DIVAN</title>');
  });

  it('never caches or falls back for the private health route', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const fixture = releaseFixture();
    const { subject, caches } = await activeManager(fetchFrom(fixture.files, calls));
    const active = await caches.open(`${RELEASE_CACHE_PREFIX}release-one`);
    await active.put('/healthz', new Response('cached health'));

    const response = await subject.respond(new Request('https://divan.test/healthz'));

    expect(response.status).toBe(404);
    expect(calls.at(-1)?.path).toBe('/healthz');
  });

  it('fetches release and worker controls with no-store and does not use a cached fallback', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const fixture = releaseFixture();
    const { subject } = await activeManager(fetchFrom(fixture.files, calls));

    await subject.respond(new Request('https://divan.test/release.json'));
    await subject.respond(new Request('https://divan.test/service-worker.js'));

    expect(calls.slice(-2).map(({ init }) => init?.cache)).toEqual(['no-store', 'no-store']);
  });

  it('uses exact cache matching and rejects a query-mutated hashed asset', async () => {
    const { subject } = await activeManager();

    const response = await subject.respond(
      new Request(
        'https://divan.test/assets/app-0123456789abcdef.js?different=1',
      ),
    );

    expect(response.status).toBe(504);
  });

  it('keeps serving the active release when a ready candidate is incomplete at navigation', async () => {
    const caches = new FakeCacheStorage();
    const first = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(releaseFixture('release-one').files),
      crypto: webcrypto,
      origin: 'https://divan.test',
      navigationTimeoutMs: 1,
    });
    await first.stageCurrentRelease();
    await first.activateRelease('release-one');
    const secondFixture = releaseFixture('release-two');
    const second = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(secondFixture.files),
      crypto: webcrypto,
      origin: 'https://divan.test',
      navigationTimeoutMs: 1,
    });
    await second.stageCurrentRelease();
    const candidate = await caches.open(`${RELEASE_CACHE_PREFIX}release-two`);
    await candidate.delete('/index.html');

    const response = await second.respond(
      new Request('https://divan.test/', { headers: { accept: 'text/html' } }),
    );

    await expect(response.text()).resolves.toContain('<title>DIVAN</title>');
    expect(await second.activePointer()).toEqual({
      activeReleaseId: 'release-one',
      previousReleaseId: null,
    });
  });

  it('caches audio only after a direct audio request and falls back to that verified item', async () => {
    const fixture = releaseFixture();
    let failAudio = false;
    const network = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(
        typeof input === 'string' ? input : input instanceof URL ? input : input.url,
        'https://divan.test',
      ).pathname;
      if (failAudio && path.startsWith('/audio/')) {
        throw new TypeError('offline');
      }
      return fetchFrom(fixture.files)(input, init);
    }) as typeof fetch;
    const { subject } = await activeManager(network);
    const audioPath = `/${(fixture.manifest['assets'] as { path: string }[]).find(({ path }) => path.startsWith('audio/'))!.path}`;
    const request = new Request(`https://divan.test${audioPath}`, {
      headers: { 'sec-fetch-dest': 'audio' },
    });

    await expect(
      (await subject.activeCache())?.match(audioPath),
    ).resolves.toBeUndefined();
    expect((await subject.respond(request)).ok).toBe(true);
    failAudio = true;
    expect((await subject.respond(request)).ok).toBe(true);
  });

  it('does not cache a script-initiated audio fetch', async () => {
    const { subject, fixture } = await activeManager();
    const audioPath = `/${(fixture.manifest['assets'] as { path: string }[]).find(({ path }) => path.startsWith('audio/'))!.path}`;

    expect(
      (await subject.respond(new Request(`https://divan.test${audioPath}`))).ok,
    ).toBe(true);
    await expect(
      (await subject.activeCache())?.match(audioPath),
    ).resolves.toBeUndefined();
  });
});
