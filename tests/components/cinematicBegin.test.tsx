import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CinematicThreshold } from '../../src/components/CinematicThreshold';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderThreshold(effectiveMotion: 'full' | 'reduced' = 'full') {
  const onArrive = vi.fn();
  const onAnnounce = vi.fn();
  render(
    <CinematicThreshold
      effectiveMotion={effectiveMotion}
      onArrive={onArrive}
      onAnnounce={onAnnounce}
    >
      <button type="button" data-cinematic-begin>
        Begin
      </button>
    </CinematicThreshold>,
  );
  return { onArrive, onAnnounce };
}

interface WalkHarness {
  readonly frames: Array<(now: number) => void>;
  advance(now: number): void;
  readonly scrollTo: ReturnType<typeof vi.fn>;
}

// Drives requestAnimationFrame manually with controlled timestamps so the
// paced corridor walk can be observed frame by frame.
function installWalkHarness(): WalkHarness {
  const frames: Array<(now: number) => void> = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  let scrollY = 0;
  const scrollTo = vi.fn((_x: number, y: number) => {
    scrollY = y;
    Object.defineProperty(window, 'scrollY', {
      value: scrollY,
      configurable: true,
    });
  });
  Object.defineProperty(window, 'scrollTo', {
    value: scrollTo,
    configurable: true,
  });
  Object.defineProperty(window, 'scrollY', {
    value: 0,
    configurable: true,
  });
  return {
    frames,
    advance(now: number) {
      const pending = frames.splice(0, frames.length);
      for (const frame of pending) {
        frame(now);
      }
    },
    scrollTo,
  };
}

function prepareCorridor() {
  const video = document.querySelector('video');
  expect(video).not.toBeNull();
  fireEvent(video!, new Event('loadeddata'));
  const section = document.querySelector('.cinematic-threshold');
  expect(section).not.toBeNull();
  Object.defineProperty(section!, 'offsetHeight', { value: 2600 });
  Object.defineProperty(window, 'innerHeight', {
    value: 800,
    configurable: true,
  });
  return section!;
}

describe('cinematic Begin control', () => {
  it('walks the corridor at a paced human speed instead of jumping to the end', () => {
    const harness = installWalkHarness();
    const { onArrive, onAnnounce } = renderThreshold();
    prepareCorridor();

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    expect(onAnnounce).toHaveBeenCalledWith('Entering the reading alcove.');
    expect(onArrive).not.toHaveBeenCalled();

    // One second into the walk the corridor must still be mostly untravelled —
    // a native smooth scroll would already have finished by now.
    harness.advance(0);
    harness.advance(1000);
    const travelled = window.scrollY;
    expect(travelled).toBeGreaterThan(0);
    expect(travelled).toBeLessThan(1800 * 0.3);

    // The walk keeps requesting frames until the corridor end.
    expect(harness.frames.length).toBeGreaterThan(0);
    harness.advance(20_000);
    expect(window.scrollY).toBe(1800);
  });

  it('takes several seconds to finish the walk', () => {
    const harness = installWalkHarness();
    renderThreshold();
    prepareCorridor();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    harness.advance(0);
    harness.advance(4000);
    // Four seconds in, the walk must still be under way.
    expect(window.scrollY).toBeLessThan(1800);
    harness.advance(20_000);
    expect(window.scrollY).toBe(1800);
  });

  it('yields to the visitor when they scroll during the walk', () => {
    const harness = installWalkHarness();
    renderThreshold();
    prepareCorridor();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    harness.advance(0);
    harness.advance(1000);
    const beforeInterrupt = window.scrollY;
    fireEvent.wheel(window);
    harness.advance(2000);
    harness.advance(20_000);
    expect(window.scrollY).toBe(beforeInterrupt);
  });

  it('completes arrival when the video dies mid-walk instead of dropping the Begin intent', () => {
    const harness = installWalkHarness();
    const { onArrive } = renderThreshold();
    prepareCorridor();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    harness.advance(0);
    harness.advance(1000);
    expect(onArrive).not.toHaveBeenCalled();

    // The clip errors while the guided walk is under way. The corridor and
    // its scroll-driven arrival machinery collapse with it, so the walk must
    // finish the visitor's journey directly rather than strand them at a
    // poster they already left.
    const video = document.querySelector('video');
    fireEvent(video!, new Event('error'));

    expect(onArrive).toHaveBeenCalledTimes(1);
    const scrolled = window.scrollY;
    harness.advance(2000);
    harness.advance(20_000);
    expect(window.scrollY).toBe(scrolled);
  });

  it('arrives directly when reduced motion disables the cinematic corridor', () => {
    const { onArrive } = renderThreshold('reduced');

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    expect(onArrive).toHaveBeenCalledTimes(1);
  });

  it('arrives directly when the environment rejects programmatic scrolling', () => {
    const { onArrive } = renderThreshold();
    prepareCorridor();
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn(() => {
        throw new Error('scrolling unavailable');
      }),
      configurable: true,
    });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    expect(onArrive).toHaveBeenCalledTimes(1);
  });
});
