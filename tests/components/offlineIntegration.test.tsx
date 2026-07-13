import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { App, type AppServices } from '../../src/app/App';
import {
  OFFLINE_STATUS_EVENT,
  type OfflineStatusDetail,
} from '../../src/sw-client/register';
import { makeVerifiedRelease } from './fixtures';

function status(detail: OfflineStatusDetail): CustomEvent<OfflineStatusDetail> {
  return new CustomEvent(OFFLINE_STATUS_EVENT, { detail });
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('registers only after browser release verification and exposes explicit activation', async () => {
  let resolveRelease: ((release: ReturnType<typeof makeVerifiedRelease>) => void) | undefined;
  const loadRelease = () =>
    new Promise<ReturnType<typeof makeVerifiedRelease>>((resolve) => {
      resolveRelease = resolve;
    });
  const registration = {
    waiting: { postMessage: vi.fn() },
  } as unknown as ServiceWorkerRegistration;
  const registerOfflineWorker = vi.fn(() => Promise.resolve(registration));
  const requestOfflineActivation = vi.fn(() => true);
  const services = {
    loadRelease,
    registerOfflineWorker,
    requestOfflineActivation,
  } as Partial<AppServices>;
  render(<App services={services} />);

  window.dispatchEvent(
    status({
      code: 'active',
      message: 'The verified offline experience is ready.',
      releaseId: 'test-only-release',
    }),
  );
  expect(registerOfflineWorker).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toBeEmptyDOMElement();

  act(() => {
    resolveRelease?.(makeVerifiedRelease());
  });
  await screen.findByRole('button', { name: 'Begin' });
  expect(registerOfflineWorker).toHaveBeenCalledOnce();
  expect(registerOfflineWorker).toHaveBeenCalledWith(
    expect.objectContaining({
      eventTarget: window,
      expectedReleaseId: 'test-only-release',
    }),
  );

  act(() => {
    window.dispatchEvent(
      status({
        code: 'update_ready',
        message: 'A verified poetry collection update is ready.',
        releaseId: 'test-only-release',
      }),
    );
  });
  const apply = screen.getByRole('button', { name: 'Apply offline update' });
  expect(screen.getByRole('status')).toHaveTextContent(
    'A verified poetry collection update is ready.',
  );

  fireEvent.click(apply);

  expect(requestOfflineActivation).toHaveBeenCalledWith(
    registration,
    'test-only-release',
  );
});

it('deduplicates matching typed statuses and ignores a different release', async () => {
  const registration = {
    waiting: { postMessage: vi.fn() },
  } as unknown as ServiceWorkerRegistration;
  render(
    <App
      services={{
        loadRelease: () => Promise.resolve(makeVerifiedRelease()),
        registerOfflineWorker: () => Promise.resolve(registration),
        requestOfflineActivation: () => true,
      }}
    />,
  );
  await screen.findByRole('button', { name: 'Begin' });
  const liveRegion = screen.getByRole('status');
  const mutations: MutationRecord[] = [];
  const observer = new MutationObserver((records) => mutations.push(...records));
  observer.observe(liveRegion, { childList: true, subtree: true });

  act(() => {
    window.dispatchEvent(
      status({
        code: 'active',
        message: 'wrong release',
        releaseId: 'different-release',
      }),
    );
  });
  expect(liveRegion).toBeEmptyDOMElement();

  const active = status({
    code: 'active',
    message: 'The verified offline experience is ready.',
    releaseId: 'test-only-release',
  });
  act(() => {
    window.dispatchEvent(active);
  });
  await Promise.resolve();
  const firstCount = mutations.length;
  act(() => {
    window.dispatchEvent(status(active.detail));
  });
  await Promise.resolve();
  observer.disconnect();

  expect(liveRegion).toHaveTextContent(
    'The verified offline experience is ready.',
  );
  expect(firstCount).toBeGreaterThan(0);
  expect(mutations).toHaveLength(firstCount);
});
