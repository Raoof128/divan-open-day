import { webcrypto } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  OfflineReleaseManager,
  PENDING_PATH,
  POINTER_CACHE_NAME,
  RELEASE_CACHE_PREFIX,
  type TimeoutAdapter,
} from '../../src-sw/releaseManager';
import {
  FakeCacheStorage,
  fetchFrom,
  jsonResponse,
  navigationRequest,
  releaseFixture,
} from './helpers';

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
      navigationRequest(),
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
      navigationRequest(),
    );

    await expect(response.text()).resolves.toContain('<title>DIVAN</title>');
    expect(await second.activePointer()).toEqual({
      activeReleaseId: 'release-one',
      previousReleaseId: null,
    });
  });

  it('activates only the exact persisted pending update during clean navigation', async () => {
    const caches = new FakeCacheStorage();
    const firstFixture = releaseFixture('release-one');
    const first = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(firstFixture.files),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });
    await first.stageCurrentRelease();
    await first.activateRelease('release-one');
    const secondFixture = releaseFixture('release-two');
    const second = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(secondFixture.files),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });
    await second.stageCurrentRelease();

    await second.respond(
      navigationRequest(),
    );

    await expect(second.activePointer()).resolves.toEqual({
      activeReleaseId: 'release-two',
      previousReleaseId: 'release-one',
    });
    await expect(second.pendingReleaseId()).resolves.toBeNull();
  });

  it('never activates a stale later-built candidate during navigation', async () => {
    const caches = new FakeCacheStorage();
    const first = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(releaseFixture('release-one').files),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });
    await first.stageCurrentRelease();
    await first.activateRelease('release-one');

    const stale = releaseFixture('release-stale');
    const staleFiles = new Map(stale.files);
    staleFiles.set(
      '/release.json',
      jsonResponse({
        ...stale.release,
        builtAt: '2036-07-13T00:00:00.000Z',
      }),
    );
    const staleManager = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(staleFiles),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });
    await staleManager.stageCurrentRelease();

    const current = releaseFixture('release-current');
    const currentManager = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(current.files),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });
    await currentManager.stageCurrentRelease();

    await currentManager.respond(navigationRequest());

    await expect(currentManager.activePointer()).resolves.toEqual({
      activeReleaseId: 'release-current',
      previousReleaseId: 'release-one',
    });
    await expect(currentManager.pendingReleaseId()).resolves.toBeNull();
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-stale`)).toBe(false);
  });

  it('keeps the active release and exact pending target after activation failure', async () => {
    const caches = new FakeCacheStorage();
    const first = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(releaseFixture('release-one').files),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });
    await first.stageCurrentRelease();
    await first.activateRelease('release-one');
    const next = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(releaseFixture('release-two').files),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });
    await next.stageCurrentRelease();
    const pointer = await caches.open(POINTER_CACHE_NAME);
    vi.spyOn(pointer, 'put').mockRejectedValueOnce(
      new Error('simulated atomic pointer failure'),
    );

    const response = await next.respond(navigationRequest());

    await expect(response.text()).resolves.toContain('<title>DIVAN</title>');
    await expect(next.activePointer()).resolves.toEqual({
      activeReleaseId: 'release-one',
      previousReleaseId: null,
    });
    await expect(next.pendingReleaseId()).resolves.toBe('release-two');
    await expect(pointer.match(PENDING_PATH)).resolves.toBeDefined();
  });

  it('treats an Accept text/html scripted fetch as ordinary network traffic', async () => {
    const fixture = releaseFixture();
    const calls: { path: string; init?: RequestInit }[] = [];
    const network = fetchFrom(
      new Map(fixture.files).set('/scripted', new Response('scripted response')),
      calls,
    );
    const { subject, caches } = await activeManager(network);
    const next = new OfflineReleaseManager({
      caches,
      fetch: fetchFrom(releaseFixture('release-two').files),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });
    await next.stageCurrentRelease();

    const response = await subject.respond(
      new Request('https://divan.test/scripted', {
        headers: { accept: 'text/html' },
        mode: 'cors',
      }),
    );

    await expect(response.text()).resolves.toBe('scripted response');
    expect(calls.at(-1)?.path).toBe('/scripted');
    await expect(subject.activePointer()).resolves.toEqual({
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
