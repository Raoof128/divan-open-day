import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION_STORAGE_KEYS } from '../../src/contracts/app';
import type { Poet } from '../../src/contracts/content';
import { App, type AppServices } from '../../src/app/App';
import { HAFEZ_ITEM, makeVerifiedRelease, RUMI_ITEM } from './fixtures';

const DISCLAIMER =
  'This is a cultural reflection experience. It does not predict outcomes and is not medical, legal, financial, religious or professional advice.';

function oneActiveHeading(): HTMLElement {
  const headings = screen.getAllByRole('heading', { level: 1 });
  expect(headings).toHaveLength(1);
  return headings[0]!;
}

async function renderLoadedApp(
  services: Partial<AppServices> = {},
): Promise<void> {
  render(
    <App
      services={{
        loadRelease: () => Promise.resolve(makeVerifiedRelease()),
        drawPoem: (poet) => ({
          id: poet === 'hafez' ? HAFEZ_ITEM.id : RUMI_ITEM.id,
          cycleReset: false,
          announcementCode: null,
          remainingInCycle: 0,
        }),
        ...services,
      }}
    />,
  );
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'A verse is waiting for you.',
    }),
  ).toBeInTheDocument();
}

function reachIntention(poet: Poet): void {
  fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
  expect(oneActiveHeading()).toHaveTextContent('Whose words will you open?');
  fireEvent.click(
    screen.getByRole('button', {
      name:
        poet === 'hafez'
          ? /Open the Divan.*Hafez/u
          : /A Moment of Reflection.*Rumi/u,
    }),
  );
}

async function finishRevealWithSkip(): Promise<void> {
  vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: 'Press to reveal' }));
  expect(oneActiveHeading()).toHaveTextContent(/Opening|Revealing/u);
  expect(screen.getByRole('status')).toHaveTextContent(
    'Revealing your verse.',
  );
  expect(screen.queryByRole('button', { name: 'Skip animation' })).toBeNull();
  await act(() => vi.advanceTimersByTimeAsync(250));
  fireEvent.click(screen.getByRole('button', { name: 'Skip animation' }));
  await act(async () => Promise.resolve());
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe.each([
  ['hafez' as const, 'Take a quiet moment.'],
  ['rumi' as const, 'Take one slow breath.'],
])('%s core flow', (poet, intentionHeading) => {
  it('renders one semantic primary scene and preserves the exact result order', async () => {
    await renderLoadedApp();
    expect(oneActiveHeading()).toHaveTextContent('A verse is waiting for you.');

    reachIntention(poet);
    expect(oneActiveHeading()).toHaveTextContent(intentionHeading);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    const revealControl = screen.getByRole('button', {
      name: 'Press to reveal',
    });
    const disclaimer = screen.getByText(DISCLAIMER);
    expect(disclaimer).toBeVisible();
    expect(revealControl.nextElementSibling).toBe(disclaimer);

    await finishRevealWithSkip();

    const resultHeading = oneActiveHeading();
    expect(resultHeading).toHaveTextContent('Your verse');
    expect(resultHeading).toHaveFocus();

    const english = screen.getByTestId('english-poem');
    const persian = screen.getByTestId('persian-poem');
    const reflection = screen.getByRole('heading', {
      level: 2,
      name: 'A reflection, not a prediction',
    }).closest('section')!;
    const source = screen.getByRole('heading', {
      level: 2,
      name: 'Source and translation information',
    }).closest('section')!;
    expect(
      english.compareDocumentPosition(persian) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      persian.compareDocumentPosition(reflection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      reflection.compareDocumentPosition(source) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(persian).toHaveAttribute('lang', 'fa');
    expect(persian).toHaveAttribute('dir', 'rtl');
    expect(within(persian).getAllByRole('paragraph')).toHaveLength(2);
    expect(source.querySelectorAll('bdi').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Reveal another' })).toBeEnabled();
  });
});

it('prevents a second reveal activation and exposes skip without stealing focus', async () => {
  const drawPoem = vi.fn((poet: Poet) => ({
    id: poet === 'hafez' ? HAFEZ_ITEM.id : RUMI_ITEM.id,
    cycleReset: false,
    announcementCode: null,
    remainingInCycle: 0,
  }));
  await renderLoadedApp({ drawPoem });
  reachIntention('hafez');
  vi.useFakeTimers();
  const reveal = screen.getByRole('button', { name: 'Press to reveal' });
  const motionControl = screen.getByLabelText('Motion');
  motionControl.focus();
  expect(motionControl).toHaveFocus();

  fireEvent.click(reveal);
  fireEvent.click(reveal);
  expect(drawPoem).toHaveBeenCalledTimes(1);
  await act(() => vi.advanceTimersByTimeAsync(99));
  expect(screen.queryByRole('button', { name: 'Skip animation' })).toBeNull();
  await act(() => vi.advanceTimersByTimeAsync(1));
  const skip = screen.getByRole('button', { name: 'Skip animation' });
  expect(skip).toHaveProperty('tabIndex', 0);
  expect(skip).not.toHaveFocus();
  expect(motionControl).toHaveFocus();
});

it('uses a 150ms opacity path when reduced motion is selected', async () => {
  await renderLoadedApp();
  fireEvent.change(screen.getByLabelText('Motion'), {
    target: { value: 'reduced' },
  });
  expect(window.localStorage.getItem(SESSION_STORAGE_KEYS.motionPreference)).toBe(
    'reduced',
  );
  reachIntention('rumi');
  vi.useFakeTimers();

  fireEvent.click(screen.getByRole('button', { name: 'Press to reveal' }));
  await act(() => vi.advanceTimersByTimeAsync(149));
  expect(oneActiveHeading()).not.toHaveTextContent('Your verse');
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(oneActiveHeading()).toHaveTextContent('Your verse');
});

it('uses durable history entries for real Back and Forward traversal', async () => {
  const pushState = vi.spyOn(window.history, 'pushState');
  await renderLoadedApp();
  reachIntention('hafez');
  await finishRevealWithSkip();
  expect(oneActiveHeading()).toHaveTextContent('Your verse');
  vi.useRealTimers();

  act(() => {
    window.history.back();
  });
  await waitFor(() =>
    expect(oneActiveHeading()).toHaveTextContent('Take a quiet moment.'),
  );
  act(() => {
    window.history.back();
  });
  await waitFor(() =>
    expect(oneActiveHeading()).toHaveTextContent('Whose words will you open?'),
  );
  act(() => {
    window.history.forward();
  });
  await waitFor(() =>
    expect(oneActiveHeading()).toHaveTextContent('Take a quiet moment.'),
  );
  act(() => {
    window.history.forward();
  });
  await waitFor(() =>
    expect(oneActiveHeading()).toHaveTextContent('Your verse'),
  );

  const pushedStages = pushState.mock.calls.map(
    ([value]) => (value as { readonly stage: string }).stage,
  );
  expect(pushedStages).toEqual(['choose_poet', 'intention', 'result']);
  expect(pushedStages).not.toContain('revealing');
});

it('uses strictly validated PopStateEvent state', async () => {
  await renderLoadedApp();
  fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

  act(() => {
    window.dispatchEvent(
      new PopStateEvent('popstate', {
        state: {
          stage: 'intention',
          selectedPoet: 'hafez',
          releaseId: 'test-only-release',
        },
      }),
    );
  });
  expect(oneActiveHeading()).toHaveTextContent('Take a quiet moment.');

  act(() => {
    window.dispatchEvent(
      new PopStateEvent('popstate', {
        state: {
          stage: 'result',
          selectedPoet: 'hafez',
          releaseId: 'test-only-release',
          currentPoemId: 'hafez-one',
        },
      }),
    );
  });
  expect(oneActiveHeading()).toHaveTextContent('A verse is waiting for you.');
});

it('hydrates a verified result with replaceState and no duplicate entry', async () => {
  const services: Partial<AppServices> = {
    loadRelease: () => Promise.resolve(makeVerifiedRelease()),
    drawPoem: (poet) => ({
      id: poet === 'hafez' ? HAFEZ_ITEM.id : RUMI_ITEM.id,
      cycleReset: false,
      announcementCode: null,
      remainingInCycle: 0,
    }),
  };
  const firstRender = render(<App services={services} />);
  await screen.findByRole('button', { name: 'Begin' });
  reachIntention('hafez');
  await finishRevealWithSkip();
  vi.useRealTimers();
  const historyLength = window.history.length;
  firstRender.unmount();

  render(<App services={services} />);
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Your verse' }),
  ).toBeInTheDocument();
  await act(async () => Promise.resolve());
  expect(window.history.length).toBe(historyLength);
});

it('writes only approved public state and never visitor intention', async () => {
  await renderLoadedApp();
  reachIntention('hafez');
  await finishRevealWithSkip();

  const approvedKeys = new Set(Object.values(SESSION_STORAGE_KEYS));
  const sessionKeys = Object.keys(window.sessionStorage);
  expect(sessionKeys.length).toBeGreaterThan(0);
  expect(sessionKeys.every((key) => approvedKeys.has(key as never))).toBe(true);
  expect([...sessionKeys, ...Object.keys(window.localStorage)]).not.toContain(
    'visitorIntention',
  );
  expect([...sessionKeys, ...Object.keys(window.localStorage)]).not.toContain(
    'visitorId',
  );
});
