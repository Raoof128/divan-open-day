import { describe, expect, it, vi } from 'vitest';

import {
  OFFLINE_STATUS_EVENT,
  registerOfflineWorker,
  requestOfflineActivation,
} from '../../src/sw-client/register';

describe('nonblocking service-worker client', () => {
  it('reports registration failure without exposing the exception or rejecting', async () => {
    const events: Event[] = [];
    const target = new EventTarget();
    target.addEventListener(OFFLINE_STATUS_EVENT, (event) =>
      events.push(event),
    );
    const register = vi
      .fn()
      .mockRejectedValue(new Error('private stack and URL'));

    await expect(
      registerOfflineWorker({
        serviceWorker: { register } as unknown as ServiceWorkerContainer,
        eventTarget: target,
        secureContext: true,
      }),
    ).resolves.toBeNull();
    expect(events).toHaveLength(2);
    expect(JSON.stringify(events)).not.toContain('private stack');
  });

  it('registers the fixed worker with update-safe options', async () => {
    const registration = { waiting: null } as ServiceWorkerRegistration;
    const register = vi.fn().mockResolvedValue(registration);

    await expect(
      registerOfflineWorker({
        serviceWorker: { register } as unknown as ServiceWorkerContainer,
        eventTarget: new EventTarget(),
        secureContext: true,
      }),
    ).resolves.toBe(registration);
    expect(register).toHaveBeenCalledWith('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none',
    });
  });

  it('requests explicit activation only from a waiting worker', () => {
    const postMessage = vi.fn();
    const waiting = {
      state: 'installed',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      postMessage,
    } as unknown as ServiceWorker;
    expect(
      requestOfflineActivation(
        { waiting } as unknown as ServiceWorkerRegistration,
        'release-one',
      ),
    ).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({
      type: 'ACTIVATE_READY_RELEASE',
      releaseId: 'release-one',
    });
  });

  it('emits the worker activating status with its exact target release', async () => {
    const events: CustomEvent[] = [];
    const target = new EventTarget();
    target.addEventListener(OFFLINE_STATUS_EVENT, (event) =>
      events.push(event as CustomEvent),
    );
    let onMessage: ((event: MessageEvent) => void) | undefined;
    const serviceWorker = {
      addEventListener: vi.fn(
        (_type: string, listener: (event: MessageEvent) => void) => {
          onMessage = listener;
        },
      ),
      register: vi.fn().mockResolvedValue({ waiting: null }),
    } as unknown as ServiceWorkerContainer;
    await registerOfflineWorker({
      serviceWorker,
      eventTarget: target,
      secureContext: true,
    });

    onMessage?.({
      data: {
        source: 'divan-service-worker',
        code: 'activating',
        releaseId: 'release-one',
      },
    } as MessageEvent);

    expect(events.at(-1)?.detail).toEqual({
      code: 'activating',
      message: 'Applying the verified offline update.',
      releaseId: 'release-one',
    });
  });

  it('does not register outside a secure context even when the API is exposed', async () => {
    const register = vi.fn();

    await expect(
      registerOfflineWorker({
        serviceWorker: { register } as unknown as ServiceWorkerContainer,
        eventTarget: new EventTarget(),
        secureContext: false,
      }),
    ).resolves.toBeNull();
    expect(register).not.toHaveBeenCalled();
  });

  it('reports waiting and newly installed workers with the verified release ID', async () => {
    const details: unknown[] = [];
    const target = new EventTarget();
    target.addEventListener(OFFLINE_STATUS_EVENT, (event) =>
      details.push((event as CustomEvent).detail),
    );
    let updateFound: (() => void) | undefined;
    let stateChanged: (() => void) | undefined;
    const installing = {
      state: 'installing',
      addEventListener: vi.fn((_type: string, listener: () => void) => {
        stateChanged = listener;
      }),
    };
    const registration = {
      waiting: { postMessage: vi.fn() },
      installing,
      addEventListener: vi.fn((_type: string, listener: () => void) => {
        updateFound = listener;
      }),
    } as unknown as ServiceWorkerRegistration;
    const serviceWorker = {
      addEventListener: vi.fn(),
      register: vi.fn().mockResolvedValue(registration),
    } as unknown as ServiceWorkerContainer;

    await registerOfflineWorker({
      serviceWorker,
      eventTarget: target,
      secureContext: true,
      expectedReleaseId: 'release-one',
    });
    expect(details.at(-1)).toMatchObject({
      code: 'update_ready',
      releaseId: 'release-one',
    });

    (registration as { waiting: ServiceWorker | null }).waiting = null;
    updateFound?.();
    (registration as { waiting: ServiceWorker | null }).waiting = {
      postMessage: vi.fn(),
    } as unknown as ServiceWorker;
    installing.state = 'installed';
    stateChanged?.();
    expect(details.at(-1)).toMatchObject({
      code: 'update_ready',
      releaseId: 'release-one',
    });
  });

  it('replaces the current URL only after the exact waiting worker activates', () => {
    const postMessage = vi.fn();
    let stateChanged: (() => void) | undefined;
    const replace = vi.fn();
    const waiting = {
      state: 'installed',
      addEventListener: vi.fn((_type: string, listener: () => void) => {
        stateChanged = listener;
      }),
      removeEventListener: vi.fn(),
      postMessage,
    } as unknown as ServiceWorker;

    expect(
      requestOfflineActivation(
        { waiting } as unknown as ServiceWorkerRegistration,
        'release-one',
        { replace, currentUrl: 'https://divan.test/' },
      ),
    ).toBe(true);
    expect(replace).not.toHaveBeenCalled();
    (waiting as unknown as { state: string }).state = 'activated';
    stateChanged?.();
    expect(replace).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith('https://divan.test/');
  });

  it('cleans superseded activation listeners so retries reload at most once', () => {
    const listeners = new Set<() => void>();
    const timers: (() => void)[] = [];
    const replace = vi.fn();
    const waiting = {
      state: 'installed',
      addEventListener: vi.fn((_type: string, listener: () => void) => {
        listeners.add(listener);
      }),
      removeEventListener: vi.fn((_type: string, listener: () => void) => {
        listeners.delete(listener);
      }),
      postMessage: vi.fn(),
    } as unknown as ServiceWorker;
    const registration = { waiting } as unknown as ServiceWorkerRegistration;
    const options = {
      replace,
      currentUrl: 'https://divan.test/',
      setTimer: (callback: () => void) => {
        timers.push(callback);
        return timers.length - 1;
      },
      clearTimer: vi.fn(),
    };

    expect(requestOfflineActivation(registration, 'release-one', options)).toBe(
      true,
    );
    expect(requestOfflineActivation(registration, 'release-one', options)).toBe(
      true,
    );
    expect(listeners).toHaveLength(1);

    timers[0]?.();
    expect(listeners).toHaveLength(1);
    (waiting as unknown as { state: string }).state = 'activated';
    for (const listener of [...listeners]) {
      listener();
    }

    expect(listeners).toHaveLength(0);
    expect(replace).toHaveBeenCalledOnce();
  });
});
