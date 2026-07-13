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
    requestOfflineActivation({ waiting: { postMessage } } as unknown as ServiceWorkerRegistration);
    expect(postMessage).toHaveBeenCalledWith({ type: 'ACTIVATE_READY_RELEASE' });
  });
});
