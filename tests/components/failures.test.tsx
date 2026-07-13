import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { App } from '../../src/app/App';
import { ErrorBoundary } from '../../src/app/ErrorBoundary';
import { HAFEZ_ITEM, makeVerifiedRelease } from './fixtures';

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('renders a recoverable blocking error without exposing loader details', async () => {
  const loadRelease = vi
    .fn<() => Promise<never>>()
    .mockRejectedValue(new Error('/private/path SECRET_TOKEN stack trace'));
  render(<App services={{ loadRelease }} />);

  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'The experience could not finish loading.',
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(/collection is being prepared/u)).toBeVisible();
  expect(document.body).not.toHaveTextContent('SECRET_TOKEN');
  expect(document.body).not.toHaveTextContent('/private/path');

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(loadRelease).toHaveBeenCalledTimes(2);
});

it('keeps the poem visible and announces a native audio failure once', async () => {
  render(
    <App
      services={{
        loadRelease: () => Promise.resolve(makeVerifiedRelease([HAFEZ_ITEM])),
        drawPoem: () => ({
          id: HAFEZ_ITEM.id,
          cycleReset: false,
          announcementCode: null,
          remainingInCycle: 0,
        }),
      }}
    />,
  );
  await screen.findByRole('button', { name: 'Begin' });
  fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
  fireEvent.click(screen.getByRole('button', { name: /Open the Divan.*Hafez/u }));
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: 'Press to reveal' }));
  await act(() => vi.advanceTimersByTimeAsync(250));
  fireEvent.click(screen.getByRole('button', { name: 'Skip animation' }));

  const audio = screen
    .getByRole('heading', { level: 2, name: 'Listen in Persian' })
    .closest('section')!
    .querySelector('audio')!;
  expect(audio).toHaveAttribute('preload', 'metadata');
  expect(audio).not.toHaveAttribute('autoplay');
  fireEvent.error(audio);

  expect(screen.getByRole('heading', { level: 1, name: 'Your verse' })).toBeVisible();
  expect(screen.getAllByText('Persian audio is unavailable right now.')).toHaveLength(2);
  expect(screen.getAllByRole('status')).toHaveLength(1);
  expect(screen.queryByRole('alert')).toBeNull();
});

it('announces offline readiness in one persistent polite atomic region', async () => {
  render(
    <App services={{ loadRelease: () => Promise.resolve(makeVerifiedRelease()) }} />,
  );
  await screen.findByRole('button', { name: 'Begin' });

  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
  const liveRegion = screen.getByRole('status');
  expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  expect(liveRegion).toHaveTextContent(
    'You are offline, but your poetry experience is ready.',
  );
});

it('contains render crashes without exposing a stack, secret, or path', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  function CrashingChild(): never {
    throw new Error('/Users/private SECRET_TOKEN render stack');
  }

  render(
    <ErrorBoundary>
      <CrashingChild />
    </ErrorBoundary>,
  );

  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'The experience could not continue.',
    }),
  ).toBeVisible();
  expect(document.body).not.toHaveTextContent('SECRET_TOKEN');
  expect(document.body).not.toHaveTextContent('/Users/private');
  expect(document.body).not.toHaveTextContent('stack');
});
