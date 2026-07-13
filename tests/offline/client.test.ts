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
    target.addEventListener(OFFLINE_STATUS_EVENT, (event) => events.push(event));
    const register = vi.fn().mockRejectedValue(new Error('private stack and URL'));

    await expect(
      registerOfflineWorker({
        serviceWorker: { register } as unknown as ServiceWorkerContainer,
        eventTarget: target,
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
      }),
    ).resolves.toBe(registration);
    expect(register).toHaveBeenCalledWith('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none',
    });
  });

  it('requests explicit activation only from a waiting worker', () => {
    const postMessage = vi.fn();
    expect(
      requestOfflineActivation(
        { waiting: { postMessage } } as unknown as ServiceWorkerRegistration,
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
    await registerOfflineWorker({ serviceWorker, eventTarget: target });

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
});
