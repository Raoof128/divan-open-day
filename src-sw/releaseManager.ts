import { z } from 'zod';

import { MAX_RELEASE_ASSET_BYTES } from '../src/contracts/release';
import type { CacheLike, CacheStorageLike, CryptoLike } from './cacheTypes';
import {
  canonicalStringify,
  parseCanonicalJson,
  responseFromBytes,
  sha256,
} from './integrity';
import {
  OFFLINE_RELEASE_BYTES_HARD_LIMIT,
  offlineAssetManifestSchema,
  offlineCorpusSchema,
  offlineReleaseDescriptorSchema,
  type OfflineAssetManifest,
  type OfflineCorpus,
  type OfflineReleaseDescriptor,
} from './schemas';

export const RELEASE_CACHE_PREFIX = 'divan-release-v2:';
export const POINTER_CACHE_NAME = 'divan-release-pointers-v2';
export const RELEASE_POINTER_PATH = '/__divan/release-pointer-v2';
export const READY_PATH = '/__divan/release-ready-v2';
export const PENDING_PATH = '/__divan/release-pending-v2';

const DEFAULT_NAVIGATION_TIMEOUT_MS = 2_500;
const RELEASE_JSON_PATH = '/release.json';
const SERVICE_WORKER_PATH = '/service-worker.js';
const HEALTH_PATH = '/healthz';

const readyRecordSchema = z
  .object({
    releaseId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    schemaVersion: z.literal(2),
    builtAt: z.string().datetime({ offset: true }),
    buildProfile: z.enum(['fixture', 'production']),
    productionEligible: z.boolean(),
    itemCount: z.number().int().nonnegative(),
    hafezCount: z.number().int().nonnegative(),
    rumiCount: z.number().int().nonnegative(),
    contentPath: z.string().regex(/^\/content\/[a-f0-9]{64}\.json$/u),
    contentSha256: z.string().regex(/^[a-f0-9]{64}$/u),
    assetManifestPath: z.string().regex(/^\/assets\/[a-f0-9]{64}\.json$/u),
    assetManifestSha256: z.string().regex(/^[a-f0-9]{64}$/u),
    requiredPaths: z.array(z.string().startsWith('/')).min(1),
  })
  .strict();

const pointerSchema = z
  .object({
    activeReleaseId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    previousReleaseId: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
      .nullable(),
  })
  .strict();

const pendingRecordSchema = z
  .object({
    releaseId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
  })
  .strict();

type ReadyRecord = z.infer<typeof readyRecordSchema>;
export type ReleasePointer = z.infer<typeof pointerSchema>;

export type StageResult =
  | {
      readonly status: 'active';
      readonly releaseId: string;
      readonly contentSha256: string;
    }
  | {
      readonly status: 'ready';
      readonly releaseId: string;
      readonly contentSha256: string;
    };

export interface OfflineReleaseManagerOptions {
  readonly caches: CacheStorageLike;
  readonly fetch: typeof fetch;
  readonly crypto: CryptoLike;
  readonly origin: string;
  readonly navigationTimeoutMs?: number;
  readonly timers?: TimeoutAdapter;
}

export interface TimeoutAdapter {
  set(callback: () => void, milliseconds: number): unknown;
  clear(handle: unknown): void;
}

export class OfflineReleaseManager {
  readonly #caches: CacheStorageLike;
  readonly #fetch: typeof fetch;
  readonly #crypto: CryptoLike;
  readonly #origin: URL;
  readonly #navigationTimeoutMs: number;
  readonly #timers: TimeoutAdapter;
  #operation: Promise<void> = Promise.resolve();

  public constructor(options: OfflineReleaseManagerOptions) {
    this.#caches = options.caches;
    this.#fetch = options.fetch;
    this.#crypto = options.crypto;
    this.#origin = new URL(options.origin);
    this.#navigationTimeoutMs =
      options.navigationTimeoutMs ?? DEFAULT_NAVIGATION_TIMEOUT_MS;
    this.#timers = options.timers ?? {
      set: (callback, milliseconds) => setTimeout(callback, milliseconds),
      clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    };
  }

  public stageCurrentRelease(): Promise<StageResult> {
    return this.#serialized(() => this.#stageCurrentRelease());
  }

  public activateRelease(releaseId: string): Promise<void> {
    return this.#serialized(() => this.#activateRelease(releaseId));
  }

  public activatePendingRelease(): Promise<void> {
    return this.#serialized(async () => {
      const releaseId = await this.pendingReleaseId();
      if (releaseId !== null) {
        await this.#activateRelease(releaseId);
      }
    });
  }

  public async pendingReleaseId(): Promise<string | null> {
    if (!(await this.#caches.keys()).includes(POINTER_CACHE_NAME)) {
      return null;
    }
    const cache = await this.#caches.open(POINTER_CACHE_NAME);
    const response = await cache.match(PENDING_PATH);
    if (response === undefined) {
      return null;
    }
    try {
      return pendingRecordSchema.parse(await response.json()).releaseId;
    } catch {
      return null;
    }
  }

  public async activePointer(): Promise<ReleasePointer | null> {
    if (!(await this.#caches.keys()).includes(POINTER_CACHE_NAME)) {
      return null;
    }
    const cache = await this.#caches.open(POINTER_CACHE_NAME);
    const response = await cache.match(RELEASE_POINTER_PATH);
    if (response === undefined) {
      return null;
    }
    try {
      return pointerSchema.parse(await response.json());
    } catch {
      return null;
    }
  }

  public async activeCache(): Promise<CacheLike | null> {
    const pointer = await this.activePointer();
    if (pointer === null) {
      return null;
    }
    const ready = await this.#readReady(pointer.activeReleaseId);
    if (ready === null || !(await this.#candidateComplete(ready))) {
      return null;
    }
    return this.#caches.open(this.#cacheName(pointer.activeReleaseId));
  }

  public async respond(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.origin !== this.#origin.origin || request.method !== 'GET') {
      return this.#fetch(request);
    }
    if (url.pathname === HEALTH_PATH) {
      return this.#networkControl(request);
    }
    if (url.pathname === SERVICE_WORKER_PATH) {
      return this.#networkControl(request);
    }
    if (url.pathname === RELEASE_JSON_PATH) {
      return this.#releasePointerResponse(request);
    }
    if (this.#isNavigation(request)) {
      try {
        await this.activatePendingRelease();
      } catch {
        // A failed exact-target activation must not block the active release.
      }
      return this.#navigationResponse(request);
    }

    const active = await this.activeCache();
    if (url.pathname.startsWith('/audio/')) {
      return this.#audioResponse(request, active);
    }
    if (
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/content/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname === '/manifest.webmanifest' ||
      url.pathname === '/offline.html'
    ) {
      const cached = await active?.match(request);
      if (cached !== undefined) {
        return cached;
      }
      // §16.4 cache first: when the verified cache cannot answer (lost or
      // corrupted release cache, exact-match miss on a query variant), the
      // network answers with the origin's canonical bytes. Hashed and
      // content-addressed paths stay release-coherent by construction; a 504
      // is fabricated only when the network is unreachable too. Redirects
      // fail closed for parity with every other release network path.
      try {
        return await this.#fetch(request, { redirect: 'error' });
      } catch {
        return new Response('Release asset unavailable.', { status: 504 });
      }
    }
    return this.#fetch(request);
  }

  async #stageCurrentRelease(): Promise<StageResult> {
    const releaseResult = await this.#fetchBytes(RELEASE_JSON_PATH);
    const descriptor = offlineReleaseDescriptorSchema.parse(
      parseCanonicalJson(releaseResult.bytes),
    );
    const pointer = await this.activePointer();
    if (pointer?.activeReleaseId === descriptor.releaseId) {
      const activeReady = await this.#readReady(descriptor.releaseId);
      if (
        activeReady === null ||
        !(await this.#candidateComplete(activeReady)) ||
        !this.#sameRelease(activeReady, descriptor)
      ) {
        throw new Error('Active release metadata is incoherent.');
      }
      await this.#clearPending();
      return {
        status: 'active',
        releaseId: descriptor.releaseId,
        contentSha256: descriptor.contentSha256,
      };
    }

    const cacheName = this.#cacheName(descriptor.releaseId);
    const isProtectedRollback =
      pointer?.previousReleaseId === descriptor.releaseId;
    const existingReady = await this.#readReady(descriptor.releaseId);
    if (existingReady !== null) {
      if (!this.#sameRelease(existingReady, descriptor)) {
        if (!isProtectedRollback) {
          await this.#caches.delete(cacheName);
        }
        throw new Error('A release ID cannot be reused with different hashes.');
      }
      if (await this.#candidateComplete(existingReady)) {
        await this.#writePending(descriptor.releaseId);
        return {
          status: 'ready',
          releaseId: descriptor.releaseId,
          contentSha256: descriptor.contentSha256,
        };
      }
    }
    if (isProtectedRollback) {
      throw new Error(
        'Protected rollback release metadata is incoherent or incomplete.',
      );
    }

    await this.#caches.delete(cacheName);
    const candidate = await this.#caches.open(cacheName);
    try {
      const corpusResult = await this.#fetchBytes(
        descriptor.contentPath,
        descriptor.contentSha256,
      );
      const corpus = offlineCorpusSchema.parse(
        parseCanonicalJson(corpusResult.bytes),
      );
      await this.#verifyCorpus(descriptor, corpus);

      const manifestResult = await this.#fetchBytes(
        descriptor.assetManifestPath,
        descriptor.assetManifestSha256,
      );
      const manifest = offlineAssetManifestSchema.parse(
        parseCanonicalJson(manifestResult.bytes),
      );
      this.#verifyManifest(descriptor, manifest);
      this.#verifyCorpusManifestJoin(corpus, manifest);

      let totalBytes =
        releaseResult.bytes.byteLength +
        corpusResult.bytes.byteLength +
        manifestResult.bytes.byteLength;
      const requiredPaths: string[] = [];
      const requiredAssets = manifest.assets.filter(
        (asset) => asset.requiredOffline,
      );
      for (const asset of requiredAssets) {
        const path = `/${asset.path}`;
        const result = await this.#fetchBytes(path, asset.sha256, asset.bytes);
        totalBytes += result.bytes.byteLength;
        if (totalBytes > OFFLINE_RELEASE_BYTES_HARD_LIMIT) {
          throw new Error('Offline release exceeds the 8 MB hard ceiling.');
        }
        await candidate.put(path, result.response);
        requiredPaths.push(path);
      }
      if (totalBytes > OFFLINE_RELEASE_BYTES_HARD_LIMIT) {
        throw new Error('Offline release exceeds the 8 MB hard ceiling.');
      }

      await candidate.put(RELEASE_JSON_PATH, releaseResult.response);
      await candidate.put(descriptor.contentPath, corpusResult.response);
      await candidate.put(
        descriptor.assetManifestPath,
        manifestResult.response,
      );
      const ready: ReadyRecord = {
        releaseId: descriptor.releaseId,
        schemaVersion: descriptor.schemaVersion,
        builtAt: descriptor.builtAt,
        buildProfile: descriptor.buildProfile,
        productionEligible: descriptor.productionEligible,
        itemCount: descriptor.itemCount,
        hafezCount: descriptor.hafezCount,
        rumiCount: descriptor.rumiCount,
        contentPath: descriptor.contentPath,
        contentSha256: descriptor.contentSha256,
        assetManifestPath: descriptor.assetManifestPath,
        assetManifestSha256: descriptor.assetManifestSha256,
        requiredPaths: requiredPaths.toSorted(),
      };
      // The marker is deliberately written last; its existence is the complete-candidate boundary.
      await candidate.put(READY_PATH, this.#jsonResponse(ready));
      // The exact pending target is persisted only after the complete marker.
      await this.#writePending(descriptor.releaseId);
      return {
        status: 'ready',
        releaseId: descriptor.releaseId,
        contentSha256: descriptor.contentSha256,
      };
    } catch (error) {
      await this.#caches.delete(cacheName);
      throw new Error('Offline release staging failed.', { cause: error });
    }
  }

  async #activateRelease(releaseId: string): Promise<void> {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(releaseId)) {
      throw new Error('Release candidate ID is invalid.');
    }
    const ready = await this.#readReady(releaseId);
    if (ready === null || !(await this.#candidateComplete(ready))) {
      throw new Error('Release candidate is not complete or ready.');
    }

    const current = await this.activePointer();
    if (current?.activeReleaseId === releaseId) {
      await this.#maintainCommittedActivation(
        releaseId,
        new Set([
          this.#cacheName(current.activeReleaseId),
          ...(current.previousReleaseId === null
            ? []
            : [this.#cacheName(current.previousReleaseId)]),
        ]),
      );
      return;
    }
    const currentReady =
      current === null ? null : await this.#readReady(current.activeReleaseId);
    const completeCurrent =
      currentReady !== null && (await this.#candidateComplete(currentReady));
    const next: ReleasePointer = {
      activeReleaseId: releaseId,
      previousReleaseId:
        completeCurrent && current !== null ? current.activeReleaseId : null,
    };
    const pointerCache = await this.#caches.open(POINTER_CACHE_NAME);
    // One Cache.put replaces the whole pointer record; no per-field state can become visible.
    await pointerCache.put(RELEASE_POINTER_PATH, this.#jsonResponse(next));

    const keep = new Set([
      this.#cacheName(next.activeReleaseId),
      ...(next.previousReleaseId === null
        ? []
        : [this.#cacheName(next.previousReleaseId)]),
    ]);
    // The pointer write is the commit boundary. Pending-marker and old-cache
    // cleanup are idempotent maintenance and must never turn a committed
    // activation into a reported failure.
    await this.#maintainCommittedActivation(releaseId, keep);
  }

  async #maintainCommittedActivation(
    releaseId: string,
    keep: ReadonlySet<string>,
  ): Promise<void> {
    try {
      const pendingReleaseId = await this.pendingReleaseId();
      if (
        pendingReleaseId !== null &&
        (pendingReleaseId === releaseId ||
          !keep.has(this.#cacheName(pendingReleaseId)))
      ) {
        await this.#clearPending(pendingReleaseId);
      }
    } catch {
      // A later activation attempt retries matching pending-marker cleanup.
      return;
    }
    let cacheNames: readonly string[];
    try {
      cacheNames = await this.#caches.keys();
    } catch {
      return;
    }
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith(RELEASE_CACHE_PREFIX) && !keep.has(cacheName)) {
        try {
          await this.#caches.delete(cacheName);
        } catch {
          // Old-cache deletion is storage maintenance after a committed pointer.
        }
      }
    }
  }

  async #writePending(releaseId: string): Promise<void> {
    const cache = await this.#caches.open(POINTER_CACHE_NAME);
    await cache.put(PENDING_PATH, this.#jsonResponse({ releaseId }));
  }

  async #clearPending(expectedReleaseId?: string): Promise<void> {
    if (!(await this.#caches.keys()).includes(POINTER_CACHE_NAME)) {
      return;
    }
    const cache = await this.#caches.open(POINTER_CACHE_NAME);
    if (expectedReleaseId !== undefined) {
      const current = await this.pendingReleaseId();
      if (current !== expectedReleaseId) {
        return;
      }
    }
    await cache.delete(PENDING_PATH);
  }

  async #verifyCorpus(
    descriptor: OfflineReleaseDescriptor,
    corpus: OfflineCorpus,
  ): Promise<void> {
    if (
      corpus.releaseId !== descriptor.releaseId ||
      corpus.items.length !== descriptor.itemCount ||
      corpus.items.filter((item) => item.poet === 'hafez').length !==
        descriptor.hafezCount ||
      corpus.items.filter((item) => item.poet === 'rumi').length !==
        descriptor.rumiCount
    ) {
      throw new Error('Corpus IDs or poet counts do not match the release.');
    }
    for (const item of corpus.items) {
      const { contentHash, ...payload } = item;
      const digest = await sha256(
        new TextEncoder().encode(canonicalStringify(payload)),
        this.#crypto,
      );
      if (digest !== contentHash) {
        throw new Error(
          'Corpus item SHA-256 does not match its canonical payload.',
        );
      }
    }
  }

  #sameRelease(
    ready: ReadyRecord,
    descriptor: OfflineReleaseDescriptor,
  ): boolean {
    return (
      ready.releaseId === descriptor.releaseId &&
      ready.schemaVersion === descriptor.schemaVersion &&
      ready.builtAt === descriptor.builtAt &&
      ready.buildProfile === descriptor.buildProfile &&
      ready.productionEligible === descriptor.productionEligible &&
      ready.itemCount === descriptor.itemCount &&
      ready.hafezCount === descriptor.hafezCount &&
      ready.rumiCount === descriptor.rumiCount &&
      ready.contentPath === descriptor.contentPath &&
      ready.contentSha256 === descriptor.contentSha256 &&
      ready.assetManifestPath === descriptor.assetManifestPath &&
      ready.assetManifestSha256 === descriptor.assetManifestSha256
    );
  }

  async #candidateComplete(ready: ReadyRecord): Promise<boolean> {
    const candidate = await this.#caches.open(this.#cacheName(ready.releaseId));
    for (const path of [
      RELEASE_JSON_PATH,
      ready.contentPath,
      ready.assetManifestPath,
      ...ready.requiredPaths,
    ]) {
      if ((await candidate.match(path)) === undefined) {
        return false;
      }
    }
    return true;
  }

  #verifyManifest(
    descriptor: OfflineReleaseDescriptor,
    manifest: OfflineAssetManifest,
  ): void {
    if (manifest.releaseId !== descriptor.releaseId) {
      throw new Error('Asset manifest release ID does not match.');
    }
    const required = manifest.assets.filter((asset) => asset.requiredOffline);
    const requiredFixedPaths = [
      'index.html',
      'manifest.webmanifest',
      'offline.html',
      'service-worker.js',
    ];
    if (
      requiredFixedPaths.some(
        (path) => required.filter((asset) => asset.path === path).length !== 1,
      ) ||
      !required.some(
        (asset) =>
          asset.path.startsWith('assets/') &&
          asset.mimeType === 'text/javascript',
      )
    ) {
      throw new Error(
        'Asset manifest is missing the required application shell.',
      );
    }
  }

  #verifyCorpusManifestJoin(
    corpus: OfflineCorpus,
    manifest: OfflineAssetManifest,
  ): void {
    const declaredAudio = new Map(
      manifest.assets
        .filter((asset) => asset.mimeType.startsWith('audio/'))
        .map((asset) => [asset.path, asset.mimeType] as const),
    );
    const referencedAudio = new Set<string>();
    for (const item of corpus.items) {
      if (item.audio === null) {
        continue;
      }
      if (declaredAudio.get(item.audio.assetPath) !== item.audio.mimeType) {
        throw new Error('Corpus audio must join one matching manifest asset.');
      }
      referencedAudio.add(item.audio.assetPath);
    }
    for (const path of declaredAudio.keys()) {
      if (!referencedAudio.has(path)) {
        throw new Error('Orphan manifest audio is not permitted.');
      }
    }
  }

  async #fetchBytes(
    path: string,
    expectedSha256?: string,
    expectedBytes?: number,
    maximumBytes = OFFLINE_RELEASE_BYTES_HARD_LIMIT,
  ): Promise<{ readonly bytes: Uint8Array; readonly response: Response }> {
    const url = new URL(path, this.#origin);
    if (url.origin !== this.#origin.origin || url.pathname !== path) {
      throw new Error('Release paths must be same-origin absolute paths.');
    }
    const response = await this.#fetch(path, {
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'error',
    });
    if (response.status !== 200) {
      throw new Error('Required release response must use exact HTTP 200.');
    }
    if (response.redirected) {
      throw new Error('Redirected release responses are forbidden.');
    }
    if (expectedBytes !== undefined && expectedBytes > maximumBytes) {
      throw new Error(
        'Required release response exceeds the offline byte ceiling.',
      );
    }
    const declaredLength = response.headers.get('content-length');
    if (declaredLength !== null) {
      const parsedLength = Number(declaredLength);
      const contentEncoding = response.headers.get('content-encoding');
      const hasEncodedWireRepresentation =
        contentEncoding !== null &&
        contentEncoding.trim().length > 0 &&
        contentEncoding
          .split(',')
          .some((encoding) => encoding.trim().toLowerCase() !== 'identity');
      if (
        !Number.isSafeInteger(parsedLength) ||
        parsedLength <= 0 ||
        parsedLength > maximumBytes ||
        (expectedBytes !== undefined &&
          !hasEncodedWireRepresentation &&
          parsedLength !== expectedBytes)
      ) {
        throw new Error(
          'Required release response declares an invalid byte size.',
        );
      }
    }
    const bytes = await this.#readBoundedBody(response, maximumBytes);
    if (bytes.byteLength === 0) {
      throw new Error('Required release response has an invalid byte size.');
    }
    if (expectedBytes !== undefined && bytes.byteLength !== expectedBytes) {
      throw new Error('Release asset byte count does not match.');
    }
    if (
      expectedSha256 !== undefined &&
      (await sha256(bytes, this.#crypto)) !== expectedSha256
    ) {
      throw new Error('Release response SHA-256 does not match.');
    }
    return { bytes, response: responseFromBytes(bytes, response) };
  }

  async #readBoundedBody(
    response: Response,
    maximumBytes: number,
  ): Promise<Uint8Array> {
    if (response.body === null) {
      return new Uint8Array();
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) {
          break;
        }
        total += result.value.byteLength;
        if (total > maximumBytes) {
          await reader.cancel();
          throw new Error(
            'Required release response exceeds the offline byte ceiling.',
          );
        }
        chunks.push(result.value.slice());
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  }

  async #readReady(releaseId: string): Promise<ReadyRecord | null> {
    const cacheName = this.#cacheName(releaseId);
    if (!(await this.#caches.keys()).includes(cacheName)) {
      return null;
    }
    const cache = await this.#caches.open(cacheName);
    const response = await cache.match(READY_PATH);
    if (response === undefined) {
      return null;
    }
    try {
      const ready = readyRecordSchema.parse(await response.json());
      return ready.releaseId === releaseId ? ready : null;
    } catch {
      return null;
    }
  }

  async #releasePointerResponse(request: Request): Promise<Response> {
    try {
      const response = await this.#networkControl(request);
      if (response.ok && !response.redirected) {
        return response;
      }
    } catch {
      // The active verified snapshot is the only permitted offline fallback.
    }
    const active = await this.activeCache();
    return (
      (await active?.match(RELEASE_JSON_PATH)) ??
      new Response('Release pointer unavailable.', { status: 503 })
    );
  }

  async #navigationResponse(request: Request): Promise<Response> {
    const active = await this.activeCache();
    const network = await this.#networkNavigation(request, active);
    if (network !== null) {
      return network;
    }
    return (
      (await active?.match('/index.html')) ??
      (await active?.match('/offline.html')) ??
      new Response('The offline experience is not ready yet.', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    );
  }

  async #networkNavigation(
    request: Request,
    active: CacheLike | null,
  ): Promise<Response | null> {
    try {
      return await this.#verifiedNetworkNavigation(request, active);
    } catch {
      // Every rejection on this path resolves to the verified cache instead of
      // escaping. A respondWith() promise that rejects is not a fallback: the
      // browser turns it into an unrecoverable network error for the whole
      // origin. An edge or proxy that rewrites the shell (byte ceiling breach,
      // digest mismatch, unparsable record) must degrade to the cached
      // release, which is exactly what a null return already means here.
      return null;
    }
  }

  async #verifiedNetworkNavigation(
    request: Request,
    active: CacheLike | null,
  ): Promise<Response | null> {
    if (active === null) {
      return this.#timedFetch(request);
    }
    const readyResponse = await active.match(READY_PATH);
    const manifestResponse =
      readyResponse === undefined
        ? undefined
        : await active.match(
            readyRecordSchema.parse(await readyResponse.json())
              .assetManifestPath,
          );
    if (manifestResponse === undefined) {
      return null;
    }
    const manifest = offlineAssetManifestSchema.parse(
      await manifestResponse.json(),
    );
    const indexAsset = manifest.assets.find(
      (asset) => asset.path === 'index.html',
    );
    if (indexAsset === undefined) {
      return null;
    }
    const response = await this.#timedFetch(request);
    if (response === null || response.status !== 200 || response.redirected) {
      return null;
    }
    const bytes = await this.#readBoundedBody(response, indexAsset.bytes);
    return bytes.byteLength === indexAsset.bytes &&
      (await sha256(bytes, this.#crypto)) === indexAsset.sha256
      ? responseFromBytes(bytes, response)
      : null;
  }

  async #timedFetch(request: Request): Promise<Response | null> {
    const controller = new AbortController();
    let timeout: unknown;
    try {
      return await Promise.race([
        this.#fetch(request, {
          cache: 'no-store',
          credentials: 'same-origin',
          redirect: 'error',
          signal: controller.signal,
        }).catch(() => null),
        new Promise<null>((resolve) => {
          timeout = this.#timers.set(() => {
            controller.abort();
            resolve(null);
          }, this.#navigationTimeoutMs);
        }),
      ]);
    } finally {
      if (timeout !== undefined) {
        this.#timers.clear(timeout);
      }
    }
  }

  async #audioResponse(
    request: Request,
    active: CacheLike | null,
  ): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (active === null) {
      return this.#fetch(request);
    }
    if (!this.#isDirectAudioRequest(request)) {
      return this.#fetch(request);
    }
    // A range-bearing media request must reach the network untouched: WebKit
    // rejects a reconstructed full 200 answering a Range request, and partial
    // responses can never enter CacheStorage anyway.
    if (request.headers.has('range')) {
      return this.#fetch(request);
    }
    const readyResponse = await active.match(READY_PATH);
    if (readyResponse === undefined) {
      return this.#fetch(request);
    }
    const ready = readyRecordSchema.parse(await readyResponse.json());
    const manifestResponse = await active.match(ready.assetManifestPath);
    if (manifestResponse === undefined) {
      return new Response('Audio unavailable.', { status: 503 });
    }
    const manifest = offlineAssetManifestSchema.parse(
      await manifestResponse.json(),
    );
    const asset = manifest.assets.find(
      (candidate) =>
        `/${candidate.path}` === path &&
        candidate.mimeType.startsWith('audio/'),
    );
    if (asset === undefined) {
      return this.#fetch(request);
    }
    try {
      const network = await this.#fetchBytes(
        path,
        asset.sha256,
        asset.bytes,
        MAX_RELEASE_ASSET_BYTES,
      );
      await active.put(path, network.response);
      return network.response;
    } catch {
      return (
        (await active.match(path)) ??
        new Response('Audio unavailable.', { status: 503 })
      );
    }
  }

  #networkControl(request: Request): Promise<Response> {
    return this.#fetch(request, {
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'error',
    });
  }

  #isNavigation(request: Request): boolean {
    return request.mode === 'navigate';
  }

  #isDirectAudioRequest(request: Request): boolean {
    return (
      request.destination === 'audio' ||
      request.headers.get('sec-fetch-dest') === 'audio'
    );
  }

  #cacheName(releaseId: string): string {
    return `${RELEASE_CACHE_PREFIX}${releaseId}`;
  }

  #jsonResponse(value: unknown): Response {
    return new Response(JSON.stringify(value), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  #serialized<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.#operation.then(operation, operation);
    this.#operation = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
