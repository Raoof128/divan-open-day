import type { CacheStorageLike, CryptoLike } from './cacheTypes';
import { OfflineReleaseManager } from './releaseManager';

declare const __DIVAN_RELEASE_ID__: string | undefined;
declare const __DIVAN_CONTENT_SHA256__: string | undefined;

export interface WorkerReleaseIdentity {
  readonly releaseId: string;
  readonly contentSha256: string;
}

const COMPILED_RELEASE_IDENTITY: WorkerReleaseIdentity | null =
  typeof __DIVAN_RELEASE_ID__ === 'string' &&
  typeof __DIVAN_CONTENT_SHA256__ === 'string'
    ? {
        releaseId: __DIVAN_RELEASE_ID__,
        contentSha256: __DIVAN_CONTENT_SHA256__,
      }
    : null;

interface ExtendableEventLike {
  waitUntil(promise: Promise<unknown>): void;
}

interface FetchEventLike extends ExtendableEventLike {
  readonly request: Request;
  respondWith(response: Promise<Response>): void;
}

interface MessageEventLike extends ExtendableEventLike {
  readonly data: unknown;
}

interface ClientLike {
  postMessage(message: unknown): void;
}

export interface DivanWorkerScope {
  readonly location: Location;
  readonly caches: CacheStorageLike;
  readonly crypto: CryptoLike;
  readonly fetch: typeof fetch;
  readonly clients: {
    claim(): Promise<void>;
    matchAll(options: {
      readonly type: 'window';
    }): Promise<readonly ClientLike[]>;
  };
  addEventListener(
    type: 'install',
    listener: (event: ExtendableEventLike) => void,
  ): void;
  addEventListener(
    type: 'activate',
    listener: (event: ExtendableEventLike) => void,
  ): void;
  addEventListener(
    type: 'fetch',
    listener: (event: FetchEventLike) => void,
  ): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEventLike) => void,
  ): void;
  skipWaiting(): Promise<void>;
}

type WorkerStatusCode = 'update_ready' | 'activating' | 'active' | 'error';

export function installDivanServiceWorker(
  scope: DivanWorkerScope,
  expectedRelease: WorkerReleaseIdentity | null = COMPILED_RELEASE_IDENTITY,
): void {
  const manager = new OfflineReleaseManager({
    caches: scope.caches,
    crypto: scope.crypto,
    fetch: scope.fetch.bind(scope),
    origin: scope.location.origin,
  });

  const notify = async (
    code: WorkerStatusCode,
    releaseId: string | null,
  ): Promise<void> => {
    const clients = await scope.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ source: 'divan-service-worker', code, releaseId });
    }
  };

  scope.addEventListener('install', (event) => {
    event.waitUntil(
      manager
        .stageCurrentRelease()
        .then(async (result) => {
          if (
            expectedRelease !== null &&
            (result.releaseId !== expectedRelease.releaseId ||
              result.contentSha256 !== expectedRelease.contentSha256)
          ) {
            throw new Error('Service-worker release identity mismatch.');
          }
          if (
            result.status === 'ready' &&
            (await manager.activePointer()) === null
          ) {
            // A first install has no waiting-worker activation window. Activate
            // only the exact candidate just verified so bootstrap cannot leave
            // the page controlled by a worker with no usable release pointer.
            await manager.activateRelease(result.releaseId);
            await notify('active', result.releaseId);
            return;
          }
          await notify(
            result.status === 'active' ? 'active' : 'update_ready',
            result.releaseId,
          );
        })
        .catch(async () => {
          await notify('error', null);
          throw new Error('Verified offline release staging failed.');
        }),
    );
  });

  scope.addEventListener('fetch', (event) => {
    event.respondWith(
      manager.respond(event.request).catch((error: unknown) => {
        // Only a navigation is rescued. A rejected respondWith() promise for a
        // navigation is not a fail-closed answer: the browser renders it as an
        // unrecoverable network error and the whole origin goes dark for every
        // controlled client. Everywhere else a rejection is the correct
        // semantic — it is exactly what a real network failure looks like, and
        // the private health route depends on it to stay a true liveness probe
        // rather than something this worker can answer.
        if (event.request.mode !== 'navigate') {
          throw error;
        }
        return new Response('The experience is temporarily unavailable.', {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }),
    );
  });

  scope.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        await scope.clients.claim();
        const pointer = await manager.activePointer();
        if (pointer !== null) {
          await notify('active', pointer.activeReleaseId);
        }
      })(),
    );
  });

  scope.addEventListener('message', (event) => {
    if (!isActivationMessage(event.data)) {
      return;
    }
    const activation = event.data;
    event.waitUntil(
      (async () => {
        try {
          await notify('activating', activation.releaseId);
          await manager.activateRelease(activation.releaseId);
          const pointer = await manager.activePointer();
          if (pointer?.activeReleaseId !== activation.releaseId) {
            throw new Error('Requested release did not become active.');
          }
          await scope.skipWaiting();
          await notify('active', activation.releaseId);
        } catch {
          await notify('error', activation.releaseId);
        }
      })(),
    );
  });
}

function isActivationMessage(value: unknown): value is {
  readonly type: 'ACTIVATE_READY_RELEASE';
  readonly releaseId: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 2 &&
    'type' in value &&
    value.type === 'ACTIVATE_READY_RELEASE' &&
    'releaseId' in value &&
    typeof value.releaseId === 'string' &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.releaseId)
  );
}

function isWorkerScope(value: unknown): value is DivanWorkerScope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'skipWaiting' in value &&
    'clients' in value &&
    'caches' in value &&
    'fetch' in value
  );
}

if (isWorkerScope(globalThis)) {
  installDivanServiceWorker(globalThis as unknown as DivanWorkerScope);
}
