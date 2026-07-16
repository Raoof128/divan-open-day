import { createHash } from 'node:crypto';

import type { CacheStorageLike } from '../../src-sw/cacheTypes';

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

export function canonicalStringify(value: unknown): string {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalStringify(entry)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`)
    .join(',')}}`;
}

export function jsonResponse(value: unknown, init?: ResponseInit): Response {
  return new Response(canonicalStringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

export function redirected(response: Response): Response {
  Object.defineProperty(response, 'redirected', { value: true });
  return response;
}

export class FakeCache {
  public readonly entries = new Map<string, Response>();

  public constructor(
    private readonly recordRejectedPartialPut: () => void = () => undefined,
  ) {}

  public match(request: RequestInfo | URL): Promise<Response | undefined> {
    const response = this.entries.get(cacheKey(request));
    return Promise.resolve(response?.clone());
  }

  public put(request: RequestInfo | URL, response: Response): Promise<void> {
    // Browser CacheStorage rejects 206 responses. Keeping the test double
    // faithful prevents partial bodies from looking cacheable in unit tests.
    if (response.status === 206) {
      this.recordRejectedPartialPut();
      return Promise.reject(
        new TypeError('Cache.put does not accept partial responses.'),
      );
    }
    this.entries.set(cacheKey(request), response.clone());
    return Promise.resolve();
  }

  public delete(request: RequestInfo | URL): Promise<boolean> {
    return Promise.resolve(this.entries.delete(cacheKey(request)));
  }
}

export class FakeCacheStorage implements CacheStorageLike {
  public readonly stores = new Map<string, FakeCache>();
  public rejectedPartialPutAttempts = 0;

  public open(cacheName: string): Promise<FakeCache> {
    const existing = this.stores.get(cacheName);
    if (existing !== undefined) {
      return Promise.resolve(existing);
    }
    const cache = new FakeCache(() => {
      this.rejectedPartialPutAttempts += 1;
    });
    this.stores.set(cacheName, cache);
    return Promise.resolve(cache);
  }

  public delete(cacheName: string): Promise<boolean> {
    return Promise.resolve(this.stores.delete(cacheName));
  }

  public keys(): Promise<string[]> {
    return Promise.resolve([...this.stores.keys()]);
  }
}

export function navigationRequest(url = 'https://divan.test/'): Request {
  const request = new Request(url, {
    headers: { accept: 'text/html' },
  });
  // Node's Request constructor forbids mode=navigate, so the adapter models
  // the browser-owned FetchEvent request without weakening production logic.
  Object.defineProperty(request, 'mode', { value: 'navigate' });
  return request;
}

function cacheKey(request: RequestInfo | URL): string {
  if (typeof request === 'string') {
    const url = new URL(request, 'https://divan.test');
    return `${url.pathname}${url.search}`;
  }
  if (request instanceof URL) {
    return `${request.pathname}${request.search}`;
  }
  const url = new URL(request.url);
  return `${url.pathname}${url.search}`;
}

export interface FixtureRelease {
  readonly release: Record<string, unknown>;
  readonly corpus: Record<string, unknown>;
  readonly manifest: Record<string, unknown>;
  readonly files: ReadonlyMap<string, Response>;
}

export function releaseFixture(releaseId = 'release-one'): FixtureRelease {
  const audio = 'audio bytes are requested only';
  const audioPath = `audio/sample-${sha256(audio).slice(0, 8)}.mp3`;
  const corpus = {
    schemaVersion: 2,
    releaseId,
    items: [
      contentItem('hafez-one', 'hafez', audioPath),
      contentItem('rumi-one', 'rumi', null),
    ],
  };
  const index = '<!doctype html><title>DIVAN</title>';
  const app = 'console.log("DIVAN")';
  const offline = '<!doctype html><title>Offline</title>';
  const manifestDocument = '{"name":"DIVAN"}';
  const iconDocument = '<svg xmlns="http://www.w3.org/2000/svg" />';
  const worker = 'self.addEventListener("fetch", function () {})';
  const posterMobile = 'TEST ONLY POSTER MOBILE';
  const posterDesktop = 'TEST ONLY POSTER DESKTOP';
  const alcoveMobile = 'TEST ONLY ALCOVE MOBILE';
  const alcoveDesktop = 'TEST ONLY ALCOVE DESKTOP';
  const cinematicMobile = 'TEST ONLY CINEMATIC MOBILE';
  const cinematicDesktop = 'TEST ONLY CINEMATIC DESKTOP';
  const assets = [
    asset('icon.svg', 'image/svg+xml', iconDocument, true),
    asset('index.html', 'text/html', index, true),
    asset('assets/app-0123456789abcdef.js', 'text/javascript', app, true),
    asset('offline.html', 'text/html', offline, true),
    asset(
      'manifest.webmanifest',
      'application/manifest+json',
      manifestDocument,
      true,
    ),
    asset('service-worker.js', 'text/javascript', worker, true),
    asset('images/divan-poster-mobile.webp', 'image/webp', posterMobile, true),
    asset(
      'images/divan-poster-desktop.webp',
      'image/webp',
      posterDesktop,
      true,
    ),
    asset('images/divan-alcove-mobile.webp', 'image/webp', alcoveMobile, true),
    asset(
      'images/divan-alcove-desktop.webp',
      'image/webp',
      alcoveDesktop,
      true,
    ),
    // Cinematic video is listed for integrity but must never be precached;
    // staging must succeed without ever requesting these paths, so the fake
    // network below deliberately has no entries for them.
    asset(
      'video/divan-cinematic-mobile.mp4',
      'video/mp4',
      cinematicMobile,
      false,
    ),
    asset(
      'video/divan-cinematic-desktop.mp4',
      'video/mp4',
      cinematicDesktop,
      false,
    ),
    asset(audioPath, 'audio/mpeg', audio, false),
  ];
  const manifest = { releaseId, assets };
  const corpusText = canonicalStringify(corpus);
  const manifestText = canonicalStringify(manifest);
  const contentDigest = sha256(corpusText);
  const manifestDigest = sha256(manifestText);
  const release = {
    releaseId,
    schemaVersion: 2,
    builtAt: '2026-07-13T00:00:00.000Z',
    buildProfile: 'production',
    productionEligible: true,
    itemCount: 2,
    hafezCount: 1,
    rumiCount: 1,
    contentPath: `/content/${contentDigest}.json`,
    contentSha256: contentDigest,
    assetManifestPath: `/assets/${manifestDigest}.json`,
    assetManifestSha256: manifestDigest,
  };
  const files = new Map<string, Response>([
    ['/release.json', jsonResponse(release)],
    [release.contentPath, new Response(corpusText)],
    [release.assetManifestPath, new Response(manifestText)],
    ['/icon.svg', new Response(iconDocument)],
    ['/index.html', new Response(index)],
    ['/assets/app-0123456789abcdef.js', new Response(app)],
    ['/offline.html', new Response(offline)],
    ['/manifest.webmanifest', new Response(manifestDocument)],
    ['/service-worker.js', new Response(worker)],
    ['/images/divan-poster-mobile.webp', new Response(posterMobile)],
    ['/images/divan-poster-desktop.webp', new Response(posterDesktop)],
    ['/images/divan-alcove-mobile.webp', new Response(alcoveMobile)],
    ['/images/divan-alcove-desktop.webp', new Response(alcoveDesktop)],
    [`/${String(assets.at(-1)!['path'])}`, new Response(audio)],
  ]);
  return { release, corpus, manifest, files };
}

function contentItem(
  id: string,
  poet: 'hafez' | 'rumi',
  audioPath: string | null,
): Record<string, unknown> {
  const payload = {
    id,
    schemaVersion: 2,
    poet,
    mode: poet === 'hafez' ? 'open_the_divan' : 'moment_of_reflection',
    display: {
      visualVariant: poet === 'hafez' ? 'garden_night' : 'lamp_constellation',
      accent: poet === 'hafez' ? 'pomegranate' : 'lapis',
    },
    source: {
      workEn: poet === 'hafez' ? 'The Divan of Hafez' : 'The Masnavi',
      workFa: poet === 'hafez' ? 'دیوان حافظ' : 'مثنوی معنوی',
      editionPublicCredit: 'Conspicuous synthetic test edition credit',
      reference: `${poet.toUpperCase()} TEST 1`,
      openingHemistichFa: poet === 'hafez' ? 'نسیم صبح سعادت' : null,
    },
    text: {
      persianLines: ['این سطر فقط برای آزمون است', 'این نیز سطر آزمون است'],
      englishLines: [
        'This line exists only for testing.',
        'This is another synthetic test line.',
      ],
      alignment: 'line',
    },
    translationClassification: 'society_translation',
    translationCredit: 'Synthetic test translation credit',
    reflection:
      'This synthetic reflection exists only to exercise strict offline release validation. It does not quote or interpret a real poem. The wording deliberately contains enough separate words to satisfy the public schema while remaining conspicuously non production and free of any invented cultural claim, source claim, permission claim, or reviewer approval.',
    audio:
      audioPath === null
        ? null
        : {
            assetPath: audioPath,
            mimeType: 'audio/mpeg',
            durationSeconds: 30,
            performerCredit: 'Synthetic test performer credit',
          },
  };
  return { ...payload, contentHash: sha256(canonicalStringify(payload)) };
}

function asset(
  path: string,
  mimeType: string,
  value: string,
  requiredOffline: boolean,
): Record<string, unknown> {
  return {
    path,
    mimeType,
    sha256: sha256(value),
    bytes: new TextEncoder().encode(value).byteLength,
    requiredOffline,
  };
}

export function fetchFrom(
  files: ReadonlyMap<string, Response>,
  calls: { path: string; init?: RequestInit }[] = [],
): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input
          : input.url,
      'https://divan.test',
    ).pathname;
    calls.push(init === undefined ? { path } : { path, init });
    const response = files.get(path);
    if (response === undefined) {
      return Promise.resolve(new Response('missing', { status: 404 }));
    }
    const clone = response.clone();
    if (response.redirected) {
      Object.defineProperty(clone, 'redirected', { value: true });
    }
    return Promise.resolve(clone);
  };
}
