import type { CacheStorageLike, CryptoLike } from './cacheTypes';
import { OfflineReleaseManager } from './releaseManager';

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
    matchAll(options: { readonly type: 'window' }): Promise<readonly ClientLike[]>;
  };
  addEventListener(
    type: 'install',
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

type WorkerStatusCode = 'update_ready' | 'active' | 'error';

export function installDivanServiceWorker(scope: DivanWorkerScope): void {
  const manager = new OfflineReleaseManager({
    caches: scope.caches,
    crypto: scope.crypto,
    fetch: scope.fetch.bind(scope),
    origin: scope.location.origin,
  });

  const notify = async (code: WorkerStatusCode): Promise<void> => {
    const clients = await scope.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ source: 'divan-service-worker', code });
    }
  };

  scope.addEventListener('install', (event) => {
    event.waitUntil(
      manager
        .stageCurrentRelease()
        .then((result) => notify(result.status === 'active' ? 'active' : 'update_ready'))
        .catch(async () => {
          await notify('error');
          throw new Error('Verified offline release staging failed.');
        }),
    );
  });

  scope.addEventListener('fetch', (event) => {
    event.respondWith(manager.respond(event.request));
  });

  scope.addEventListener('message', (event) => {
    if (!isActivationMessage(event.data)) {
      return;
    }
    event.waitUntil(
      manager
        .activateNewestReadyCandidate()
        .then(async () => {
          await notify('active');
          await scope.skipWaiting();
        })
        .catch(() => notify('error')),
    );
  });
}

function isActivationMessage(
  value: unknown,
): value is { readonly type: 'ACTIVATE_READY_RELEASE' } {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 1 &&
    'type' in value &&
    value.type === 'ACTIVATE_READY_RELEASE'
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
