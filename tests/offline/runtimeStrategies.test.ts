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
    await candidate.put(
      '/assets/app-0123456789abcdef.js',
      new Response('wrong release'),
    );

    const response = await subject.respond(
      new Request('https://divan.test/assets/app-0123456789abcdef.js'),
    );

    await expect(response.text()).resolves.toBe('console.log("DIVAN")');
  });

  it('uses the active cached index after a bounded navigation timeout', async () => {
    const fixture = releaseFixture();
    const hangingFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const path = new URL(
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input
            : input.url,
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

    const response = await subject.respond(navigationRequest());

    await expect(response.text()).resolves.toContain('<title>DIVAN</title>');
  });

  it('rejects a matching HTTP 206 navigation and serves the active cached shell', async () => {
    const fixture = releaseFixture();
    const network = ((input: RequestInfo | URL, init?: RequestInit) => {
      const pathname = new URL(
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input
            : input.url,
        'https://divan.test',
      ).pathname;
      if (pathname === '/') {
        return Promise.resolve(
          new Response('<!doctype html><title>DIVAN</title>', {
            status: 206,
            headers: { 'content-range': 'bytes 0-39/40' },
          }),
        );
      }
      return fetchFrom(fixture.files)(input, init);
    }) as typeof fetch;
    const { subject } = await activeManager(network);

    const response = await subject.respond(navigationRequest());

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain('<title>DIVAN</title>');
  });

  it('serves the active cached shell when an edge injects bytes into the navigation shell', async () => {
    // Cloudflare Web Analytics auto-injection appends a beacon script to HTML
    // for browser requests only, pushing the shell past its manifest byte
    // ceiling. That must degrade to the verified cache, never reject: a
    // rejected respondWith() is an unrecoverable ERR_FAILED for the origin.
    const fixture = releaseFixture();
    const network = ((input: RequestInfo | URL, init?: RequestInit) => {
      const pathname = new URL(
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input
            : input.url,
        'https://divan.test',
      ).pathname;
      if (pathname === '/') {
        return Promise.resolve(
          new Response(
            `<!doctype html><title>DIVAN</title><script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script>`,
            { status: 200, headers: { 'content-type': 'text/html' } },
          ),
        );
      }
      return fetchFrom(fixture.files)(input, init);
    }) as typeof fetch;
    const { subject } = await activeManager(network);

    const response = await subject.respond(navigationRequest());

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<title>DIVAN</title>');
    expect(body).not.toContain('cloudflareinsights');
  });

  it('never caches or falls back for the private health route', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const fixture = releaseFixture();
    const { subject, caches } = await activeManager(
      fetchFrom(fixture.files, calls),
    );
    const active = await caches.open(`${RELEASE_CACHE_PREFIX}release-one`);
    await active.put('/healthz', new Response('cached health'));

    const response = await subject.respond(
      new Request('https://divan.test/healthz'),
    );

    expect(response.status).toBe(404);
    expect(calls.at(-1)?.path).toBe('/healthz');
  });

  it('fetches release and worker controls with no-store and does not use a cached fallback', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const fixture = releaseFixture();
    const { subject } = await activeManager(fetchFrom(fixture.files, calls));

    await subject.respond(new Request('https://divan.test/release.json'));
    await subject.respond(new Request('https://divan.test/service-worker.js'));

    expect(calls.slice(-2).map(({ init }) => init?.cache)).toEqual([
      'no-store',
      'no-store',
    ]);
  });

  it('uses exact cache matching and answers a query-mutated hashed asset from the network, never a fuzzy cache hit', async () => {
    const { subject, caches } = await activeManager();
    // Poison the exact-match key so any fuzzy/ignoreSearch cache hit is detectable.
    const active = await caches.open(`${RELEASE_CACHE_PREFIX}release-one`);
    await active.put(
      '/assets/app-0123456789abcdef.js',
      new Response('cache body must not answer the query variant'),
    );

    const response = await subject.respond(
      new Request(
        'https://divan.test/assets/app-0123456789abcdef.js?different=1',
      ),
    );

    // §16.4 cache-first: the cache cannot answer the query variant exactly, so
    // the canonical network bytes answer instead of a fabricated 504.
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('console.log("DIVAN")');
  });

  it('falls back to the network when the active release cache cannot answer an asset request', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const fixture = releaseFixture();
    const { subject, caches } = await activeManager(
      fetchFrom(fixture.files, calls),
    );
    // Model a lost/corrupted release cache while the pointer record survives
    // (manual Cache Storage clearing, failed writes, engine anomaly).
    await caches.delete(`${RELEASE_CACHE_PREFIX}release-one`);

    const script = await subject.respond(
      new Request('https://divan.test/assets/app-0123456789abcdef.js'),
    );
    const poster = await subject.respond(
      new Request('https://divan.test/images/divan-poster-mobile.webp'),
    );

    expect(script.status).toBe(200);
    await expect(script.text()).resolves.toBe('console.log("DIVAN")');
    expect(poster.status).toBe(200);
    // Parity with every other release network path: redirects fail closed.
    expect(
      calls.filter(({ path }) => path.startsWith('/assets/app')).at(-1)?.init,
    ).toMatchObject({ redirect: 'error' });
  });

  it('serves the precached manifest icon from the active release when offline', async () => {
    // icon.svg is the PWA manifest icon. Both schemas force requiredOffline on
    // it, so it is fetched, digest-verified, charged against the 8 MB ceiling
    // and written into the release cache — but `/icons/` (plural) does not
    // prefix-match `/icon.svg`, so the router must name it explicitly or the
    // bytes are precached and then unreachable: an installed PWA loses its icon
    // offline while still paying for it against the ceiling.
    const { caches } = await activeManager();
    const offline = new OfflineReleaseManager({
      caches,
      fetch: () => Promise.reject(new TypeError('offline')),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });

    const icon = await offline.respond(
      new Request('https://divan.test/icon.svg'),
    );

    expect(icon.status).toBe(200);
    await expect(icon.text()).resolves.toContain('<svg');
  });

  it('returns a graceful 504 only when both the cache and the network cannot answer', async () => {
    const { subject, caches } = await activeManager();
    await caches.delete(`${RELEASE_CACHE_PREFIX}release-one`);
    const offline = new OfflineReleaseManager({
      caches,
      fetch: () => Promise.reject(new TypeError('offline')),
      crypto: webcrypto,
      origin: 'https://divan.test',
    });

    const response = await offline.respond(
      new Request('https://divan.test/assets/app-0123456789abcdef.js'),
    );

    expect(response.status).toBe(504);
    void subject;
  });

  it('passes a range-bearing direct audio request through to the network untouched', async () => {
    const fixture = releaseFixture();
    const seenRangeHeaders: (string | null)[] = [];
    const network = ((input: RequestInfo | URL, init?: RequestInit) => {
      if (input instanceof Request && input.url.includes('/audio/')) {
        seenRangeHeaders.push(input.headers.get('range'));
      }
      return fetchFrom(fixture.files)(input, init);
    }) as typeof fetch;
    const { subject } = await activeManager(network);
    const audioPath = `/${(fixture.manifest['assets'] as { path: string }[]).find(({ path }) => path.startsWith('audio/'))!.path}`;

    const response = await subject.respond(
      new Request(`https://divan.test${audioPath}`, {
        headers: { 'sec-fetch-dest': 'audio', range: 'bytes=0-1' },
      }),
    );

    expect(response.ok).toBe(true);
    // The original Request (with its Range header) reached the network; the
    // verify-and-cache path never ran for the partial request.
    expect(seenRangeHeaders).toEqual(['bytes=0-1']);
    await expect(
      (await subject.activeCache())?.match(audioPath),
    ).resolves.toBeUndefined();
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

    const response = await second.respond(navigationRequest());

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

    await second.respond(navigationRequest());

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
    expect(caches.stores.has(`${RELEASE_CACHE_PREFIX}release-stale`)).toBe(
      false,
    );
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
      new Map(fixture.files).set(
        '/scripted',
        new Response('scripted response'),
      ),
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
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input
            : input.url,
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
