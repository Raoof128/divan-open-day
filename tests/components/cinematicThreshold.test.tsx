import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CinematicThreshold } from '../../src/components/CinematicThreshold';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function renderThreshold(
  overrides: Partial<Parameters<typeof CinematicThreshold>[0]> = {},
) {
  const onArrive = vi.fn();
  const onAnnounce = vi.fn();
  render(
    <CinematicThreshold
      effectiveMotion="full"
      onArrive={onArrive}
      onAnnounce={onAnnounce}
      {...overrides}
    >
      <button type="button" data-cinematic-begin>
        Begin
      </button>
    </CinematicThreshold>,
  );
  return { onArrive, onAnnounce };
}

function thresholdSection(): HTMLElement {
  const section = document.querySelector('.cinematic-threshold');
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

describe('CinematicThreshold', () => {
  it('renders the poster route with no video element under reduced motion', () => {
    renderThreshold({ effectiveMotion: 'reduced' });

    expect(document.querySelector('video')).toBeNull();
    expect(thresholdSection().dataset['cinematicState']).toBe('poster');
    expect(screen.getByRole('button', { name: 'Begin' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Skip entrance' }),
    ).not.toBeInTheDocument();
  });

  it('renders the poster route with no video element while offline', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    renderThreshold();

    expect(document.querySelector('video')).toBeNull();
    expect(thresholdSection().dataset['cinematicState']).toBe('poster');
  });

  it('keeps the poster until the video reports a decoded frame', () => {
    renderThreshold();
    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(thresholdSection().dataset['cinematicState']).toBe('poster');

    fireEvent(video!, new Event('loadeddata'));

    expect(thresholdSection().dataset['cinematicState']).toBe('playing');
    expect(
      screen.getByRole('button', { name: 'Skip entrance' }),
    ).toBeInTheDocument();
  });

  it('skips to arrival from the visible entrance control', () => {
    const { onArrive, onAnnounce } = renderThreshold();
    const video = document.querySelector('video');
    fireEvent(video!, new Event('loadeddata'));

    fireEvent.click(screen.getByRole('button', { name: 'Skip entrance' }));

    expect(onArrive).toHaveBeenCalledTimes(1);
    expect(onAnnounce).toHaveBeenCalledWith('Entrance skipped.');
    expect(thresholdSection().dataset['cinematicState']).toBe('arrived');
  });

  it('demotes to the poster route when the video errors and still permits entry', () => {
    const { onArrive } = renderThreshold();
    const video = document.querySelector('video');

    fireEvent(video!, new Event('error'));

    expect(thresholdSection().dataset['cinematicState']).toBe('poster');
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    expect(onArrive).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: 'Skip entrance' }),
    ).not.toBeInTheDocument();
  });

  it('demotes to the poster route when no frame arrives within the timeout', () => {
    vi.useFakeTimers();
    renderThreshold();
    expect(document.querySelector('video')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(4100);
    });

    expect(thresholdSection().dataset['cinematicState']).toBe('poster');
    expect(document.querySelector('video')).toBeNull();
  });

  it('announces and arrives exactly once when the corridor is fully scrolled', () => {
    const { onArrive, onAnnounce } = renderThreshold();
    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'duration', { value: 8 });
    fireEvent(video, new Event('loadeddata'));

    const section = thresholdSection();
    Object.defineProperty(section, 'offsetHeight', { value: 2600 });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 1800,
      configurable: true,
    });
    fireEvent.scroll(window);
    fireEvent.scroll(window);

    expect(onArrive).toHaveBeenCalledTimes(1);
    expect(onAnnounce).toHaveBeenCalledWith(
      'You have arrived at the reading alcove.',
    );
  });
});
