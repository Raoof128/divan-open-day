import axe from 'axe-core';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, type AppServices } from '../../src/app/App';
import { ErrorBoundary } from '../../src/app/ErrorBoundary';
import type { Poet } from '../../src/contracts/content';
import { OFFLINE_STATUS_EVENT } from '../../src/sw-client/register';
import {
  HAFEZ_ITEM,
  makeVerifiedRelease,
  RUMI_ITEM,
} from '../components/fixtures';

function services(overrides: Partial<AppServices> = {}): Partial<AppServices> {
  return {
    loadRelease: () => Promise.resolve(makeVerifiedRelease()),
    drawPoem: (poet) => ({
      id: poet === 'hafez' ? HAFEZ_ITEM.id : RUMI_ITEM.id,
      cycleReset: false,
      announcementCode: null,
      remainingInCycle: 0,
    }),
    ...overrides,
  };
}

async function renderLoadedApp(
  overrides: Partial<AppServices> = {},
): Promise<ReturnType<typeof render>> {
  const rendered = render(<App services={services(overrides)} />);
  await screen.findByRole('button', { name: 'Begin' });
  return rendered;
}

async function reachIntentionByKeyboard(poet: Poet): Promise<void> {
  const user = userEvent.setup();
  const begin = screen.getByRole('button', { name: 'Begin' });
  begin.focus();
  await user.keyboard('{Enter}');
  const poetButton = screen.getByRole('button', {
    name:
      poet === 'hafez'
        ? /Open the Divan.*Hafez/u
        : /A Moment of Reflection.*Rumi/u,
  });
  poetButton.focus();
  await user.keyboard('{Enter}');
}

async function revealByKeyboard(): Promise<void> {
  const user = userEvent.setup();
  const reveal = screen.getByRole('button', { name: 'Press to reveal' });
  reveal.focus();
  await user.keyboard('{Enter}');
  await act(() => new Promise((resolve) => window.setTimeout(resolve, 180)));
}

async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const result = await axe.run(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
    },
    rules: {
      // jsdom has no canvas implementation, so real-browser axe owns this rule.
      'color-contrast': { enabled: false },
    },
  });
  expect(result.violations).toEqual([]);
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('semantic and keyboard flow', () => {
  it.each(['hafez', 'rumi'] as const)(
    'completes the %s experience with keyboard activation and focuses the result heading',
    async (poet) => {
      window.localStorage.setItem('divan.motionPreference', 'reduced');
      await renderLoadedApp();

      await reachIntentionByKeyboard(poet);
      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

      await revealByKeyboard();

      const resultHeading = screen.getByRole('heading', {
        level: 1,
        name: 'Your verse',
      });
      expect(resultHeading).toHaveFocus();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
  );

  it('keeps English before live Persian text and isolates mixed-direction source values', async () => {
    window.localStorage.setItem('divan.motionPreference', 'reduced');
    await renderLoadedApp();
    await reachIntentionByKeyboard('hafez');
    await revealByKeyboard();

    const english = screen.getByTestId('english-poem');
    const persian = screen.getByTestId('persian-poem');
    expect(
      english.compareDocumentPosition(persian) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(persian).toHaveAttribute('lang', 'fa');
    expect(persian).toHaveAttribute('dir', 'rtl');
    expect(within(persian).getAllByRole('paragraph')).toHaveLength(2);

    const source = screen
      .getByRole('heading', {
        level: 2,
        name: 'Source and translation information',
      })
      .closest('section');
    expect(source).not.toBeNull();
    expect(source?.querySelectorAll('bdi').length).toBeGreaterThanOrEqual(3);

    // §8.3: the work credit keeps its parentheses in the LTR flow; only the
    // Persian title is isolated, so the closing paren cannot mirror.
    const workDd = [...(source?.querySelectorAll('dd') ?? [])].find((dd) =>
      dd.textContent?.includes('('),
    );
    expect(workDd).toBeDefined();
    expect(workDd?.closest('[dir="rtl"]')).toBeNull();
    const workBdi = workDd?.querySelector('bdi');
    expect(workBdi).toHaveAttribute('lang', 'fa');
    expect(workBdi).toHaveAttribute('dir', 'rtl');
    expect(workBdi?.textContent).not.toMatch(/[()]/u);
    for (const node of workDd?.childNodes ?? []) {
      if (
        node.nodeType === Node.TEXT_NODE &&
        /[()]/u.test(node.textContent ?? '')
      ) {
        expect(node.parentElement?.closest('[dir="rtl"]')).toBeNull();
      }
    }
  });

  it('makes the skip link the first useful focus target and focuses main without changing history', async () => {
    await renderLoadedApp();
    const initialHistoryLength = window.history.length;
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(document.body.querySelector('a, button, select, audio')).toBe(
      skipLink,
    );

    skipLink.focus();
    fireEvent.click(skipLink);

    expect(screen.getByRole('main')).toHaveFocus();
    expect(window.history.length).toBe(initialHistoryLength);
    expect(window.location.hash).toBe('');
  });

  it('restores focus to the corresponding poet and reveal controls during history traversal', async () => {
    await renderLoadedApp();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    const hafez = screen.getByRole('button', {
      name: /Open the Divan.*Hafez/u,
    });
    fireEvent.click(hafez);

    act(() => {
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: {
            stage: 'choose_poet',
            selectedPoet: null,
            releaseId: 'test-only-release',
          },
        }),
      );
    });
    expect(
      screen.getByRole('button', { name: /Open the Divan.*Hafez/u }),
    ).toHaveFocus();

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
    expect(
      screen.getByRole('button', { name: 'Press to reveal' }),
    ).toHaveFocus();
  });
});

describe('announcements, motion, audio, and errors', () => {
  it('renders distinct reduced-motion opacity phases before the result mounts', async () => {
    let revealFrame: FrameRequestCallback | undefined;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        revealFrame = callback;
        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    window.localStorage.setItem('divan.motionPreference', 'reduced');
    await renderLoadedApp();
    await reachIntentionByKeyboard('hafez');

    fireEvent.click(screen.getByRole('button', { name: 'Press to reveal' }));
    const revealScene = document.querySelector<HTMLElement>(
      '[data-scene="revealing"]',
    );
    expect(revealScene).not.toBeNull();
    expect(revealScene).toHaveAttribute('data-reveal-phase', 'entering');
    expect(revealFrame).toBeTypeOf('function');

    act(() => revealFrame?.(16));

    expect(revealScene).toHaveAttribute('data-reveal-phase', 'visible');
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Your verse' }),
    ).toBeNull();
  });

  it('deduplicates an offline change in one polite atomic live region', async () => {
    await renderLoadedApp();
    const liveRegion = screen.getByRole('status');
    act(() => {
      window.dispatchEvent(
        new CustomEvent(OFFLINE_STATUS_EVENT, {
          detail: {
            code: 'active',
            message: 'The verified offline experience is ready.',
            releaseId: 'test-only-release',
          },
        }),
      );
    });
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) =>
      mutations.push(...records),
    );
    observer.observe(liveRegion, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await Promise.resolve();
    const firstMutationCount = mutations.length;
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await Promise.resolve();
    observer.disconnect();

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(firstMutationCount).toBeGreaterThan(0);
    expect(mutations).toHaveLength(firstMutationCount);
  });

  it('maps stored reduced and full choices ahead of the system preference', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    window.localStorage.setItem('divan.motionPreference', 'full');
    await renderLoadedApp();

    const shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-motion-preference', 'full');
    expect(shell).toHaveAttribute('data-motion', 'full');

    fireEvent.change(screen.getByLabelText('Motion'), {
      target: { value: 'reduced' },
    });
    expect(shell).toHaveAttribute('data-motion-preference', 'reduced');
    expect(shell).toHaveAttribute('data-motion', 'reduced');
  });

  it('keeps poem text and actions after a native user-initiated audio failure', async () => {
    window.localStorage.setItem('divan.motionPreference', 'reduced');
    await renderLoadedApp();
    await reachIntentionByKeyboard('hafez');
    await revealByKeyboard();

    const audio = screen.getByLabelText('Listen in Persian', {
      selector: 'audio',
    });
    expect(audio).toBeInstanceOf(HTMLAudioElement);
    expect(audio).toHaveAttribute('controls');
    expect(audio).toHaveAttribute('preload', 'metadata');
    expect(audio).not.toHaveAttribute('autoplay');
    fireEvent.error(audio);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Your verse' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Reveal another' }),
    ).toBeEnabled();
    expect(screen.getByText(HAFEZ_ITEM.text.englishLines[0]!)).toBeVisible();
    expect(
      screen.getAllByText('Persian audio is unavailable right now.'),
    ).toHaveLength(2);
    // §26.4: the honest failure message replaces the dead audio element.
    expect(
      screen.queryByLabelText('Listen in Persian', { selector: 'audio' }),
    ).toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Listen in Persian' }),
    ).toBeVisible();
  });

  it('contains a render crash in plain language without private diagnostics', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function CrashingChild(): never {
      throw new Error('/private/path SECRET_TOKEN implementation stack');
    }

    render(
      <ErrorBoundary>
        <CrashingChild />
      </ErrorBoundary>,
    );

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.body).not.toHaveTextContent('/private/path');
    expect(document.body).not.toHaveTextContent('SECRET_TOKEN');
    expect(document.body).not.toHaveTextContent('implementation stack');
  });
});

describe('automated axe scene coverage', () => {
  it('has no detected WCAG A/AA violations in boot and blocking-error scenes', async () => {
    const boot = render(
      <App
        services={{
          loadRelease: () => new Promise(() => undefined),
        }}
      />,
    );
    await expectNoAxeViolations(boot.container);
    boot.unmount();

    const blocked = render(
      <App
        services={{
          loadRelease: () => Promise.reject(new Error('private detail')),
        }}
      />,
    );
    await screen.findByRole('button', { name: 'Try again' });
    await expectNoAxeViolations(blocked.container);
  });

  it('has no detected WCAG A/AA violations in every core usable scene', async () => {
    window.localStorage.setItem('divan.motionPreference', 'reduced');
    const rendered = await renderLoadedApp();
    await expectNoAxeViolations(rendered.container);

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    await expectNoAxeViolations(rendered.container);

    fireEvent.click(
      screen.getByRole('button', { name: /A Moment of Reflection.*Rumi/u }),
    );
    await expectNoAxeViolations(rendered.container);

    fireEvent.click(screen.getByRole('button', { name: 'Press to reveal' }));
    await expectNoAxeViolations(rendered.container);
    await act(() => new Promise((resolve) => window.setTimeout(resolve, 180)));
    await expectNoAxeViolations(rendered.container);

    fireEvent.click(
      screen.getByRole('button', { name: 'Return to the stall' }),
    );
    await expectNoAxeViolations(rendered.container);
  });
});
