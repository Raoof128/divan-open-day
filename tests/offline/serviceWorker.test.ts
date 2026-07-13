import { webcrypto } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  OfflineReleaseManager,
  type ReleasePointer,
} from '../../src-sw/releaseManager';
import {
  installDivanServiceWorker,
  type DivanWorkerScope,
  type WorkerReleaseIdentity,
} from '../../src-sw/service-worker';
import {
  FakeCacheStorage,
  fetchFrom,
  releaseFixture,
} from './helpers';

type WorkerListener = (event: never) => void;

class WorkerHarness {
  readonly #listeners = new Map<string, WorkerListener>();
  readonly notifications: unknown[] = [];
  readonly skipWaiting = vi.fn(() => Promise.resolve());
  readonly claim = vi.fn(() => Promise.resolve());
  readonly scope: DivanWorkerScope;

  public constructor(
    files: ReadonlyMap<string, Response>,
    caches = new FakeCacheStorage(),
    expectedRelease: WorkerReleaseIdentity | null = null,
  ) {
    this.scope = {
      location: new URL('https://divan.test/service-worker.js') as unknown as Location,
      caches,
      crypto: webcrypto,
      fetch: fetchFrom(files),
      clients: {
        claim: this.claim,
        matchAll: () =>
          Promise.resolve([
            { postMessage: (message: unknown) => this.notifications.push(message) },
          ]),
      },
      addEventListener: (type: string, listener: WorkerListener) => {
        this.#listeners.set(type, listener);
      },
      skipWaiting: this.skipWaiting,
    };
    installDivanServiceWorker(this.scope, expectedRelease);
  }

  public async install(): Promise<void> {
    await this.#extendable('install', {});
  }

  public async message(data: unknown): Promise<boolean> {
    return this.#extendable('message', { data }, false);
  }

  public async activate(): Promise<void> {
    await this.#extendable('activate', {});
  }

  public async fetch(request: Request): Promise<Response> {
    let response: Promise<Response> | undefined;
    const listener = this.#listeners.get('fetch');
    if (listener === undefined) {
      throw new Error('Fetch listener was not installed.');
    }
    listener({
      request,
      waitUntil: () => undefined,
      respondWith: (value: Promise<Response>) => {
        response = value;
      },
    } as never);
    if (response === undefined) {
      throw new Error('Fetch listener did not provide a response.');
    }
    return response;
  }

  async #extendable(
    type: 'install' | 'activate' | 'message',
    event: Record<string, unknown>,
    required = true,
  ): Promise<boolean> {
    let lifetime: Promise<unknown> | undefined;
    const listener = this.#listeners.get(type);
    if (listener === undefined) {
      throw new Error(`${type} listener was not installed.`);
    }
    listener({
      ...event,
      waitUntil: (promise: Promise<unknown>) => {
        lifetime = promise;
      },
    } as never);
    if (lifetime === undefined) {
      if (required) {
        throw new Error(`${type} listener did not extend its lifetime.`);
      }
      return false;
    }
    await lifetime;
    return true;
  }
}

function manager(
  releaseId: string,
  caches: FakeCacheStorage,
): OfflineReleaseManager {
  const fixture = releaseFixture(releaseId);
  return new OfflineReleaseManager({
    caches,
    crypto: webcrypto,
    fetch: fetchFrom(fixture.files),
    origin: 'https://divan.test',
  });
}

async function pointer(
  releaseId: string,
  caches: FakeCacheStorage,
): Promise<ReleasePointer | null> {
  return manager(releaseId, caches).activePointer();
}

describe('service-worker lifecycle harness', () => {
  it('rejects a release pointer that does not match the versioned worker', async () => {
    const fixture = releaseFixture('release-one');
    const caches = new FakeCacheStorage();
    const harness = new WorkerHarness(fixture.files, caches, {
      releaseId: 'release-one',
      contentSha256: 'f'.repeat(64),
    });

    await expect(harness.install()).rejects.toThrow(
      'Verified offline release staging failed.',
    );
    await expect(pointer('release-one', caches)).resolves.toBeNull();
    expect(harness.notifications).toEqual([
      {
        source: 'divan-service-worker',
        code: 'error',
        releaseId: null,
      },
    ]);
  });

  it('stages on install and routes fetch through the verified active release', async () => {
    const fixture = releaseFixture('release-one');
    const caches = new FakeCacheStorage();
    const harness = new WorkerHarness(fixture.files, caches);

    await harness.install();
    expect(harness.notifications).toEqual([
      {
        source: 'divan-service-worker',
        code: 'active',
        releaseId: 'release-one',
      },
    ]);
    await expect(pointer('release-one', caches)).resolves.toEqual({
      activeReleaseId: 'release-one',
      previousReleaseId: null,
    });
    await expect(
      harness.fetch(
        new Request('https://divan.test/assets/app-0123456789abcdef.js'),
      ).then((response) => response.text()),
    ).resolves.toBe('console.log("DIVAN")');
    await harness.activate();
    expect(harness.claim).toHaveBeenCalledOnce();
    expect(harness.notifications.at(-1)).toEqual({
      source: 'divan-service-worker',
      code: 'active',
      releaseId: 'release-one',
    });
  });

  it('activates the exact requested rollback target and reports lifecycle status accurately', async () => {
    const caches = new FakeCacheStorage();
    const first = manager('release-one', caches);
    await first.stageCurrentRelease();
    await first.activateRelease('release-one');
    const second = manager('release-two', caches);
    await second.stageCurrentRelease();
    await second.activateRelease('release-two');
    const fixture = releaseFixture('release-one');
    const harness = new WorkerHarness(fixture.files, caches);
    await harness.install();

    await expect(
      harness.message({
        type: 'ACTIVATE_READY_RELEASE',
        releaseId: 'release-one',
      }),
    ).resolves.toBe(true);

    expect(await pointer('release-one', caches)).toEqual({
      activeReleaseId: 'release-one',
      previousReleaseId: 'release-two',
    });
    expect(harness.notifications.slice(-2)).toEqual([
      {
        source: 'divan-service-worker',
        code: 'activating',
        releaseId: 'release-one',
      },
      {
        source: 'divan-service-worker',
        code: 'active',
        releaseId: 'release-one',
      },
    ]);
    expect(harness.skipWaiting).toHaveBeenCalledOnce();
  });

  it('reports an invalid target as an error without claiming active or skipping waiting', async () => {
    const fixture = releaseFixture('release-one');
    const harness = new WorkerHarness(fixture.files);
    await harness.install();

    await expect(
      harness.message({
        type: 'ACTIVATE_READY_RELEASE',
        releaseId: 'missing-release',
      }),
    ).resolves.toBe(true);

    expect(harness.notifications.slice(-2)).toEqual([
      {
        source: 'divan-service-worker',
        code: 'activating',
        releaseId: 'missing-release',
      },
      {
        source: 'divan-service-worker',
        code: 'error',
        releaseId: 'missing-release',
      },
    ]);
    expect(harness.skipWaiting).not.toHaveBeenCalled();
  });
});
