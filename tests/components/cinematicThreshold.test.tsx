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

  it('keeps the timeout armed until a requested video frame is presented', () => {
    vi.useFakeTimers();
    const { onArrive } = renderThreshold();
    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    Object.defineProperty(video!, 'requestVideoFrameCallback', {
      value: vi.fn(),
      configurable: true,
    });

    fireEvent(video!, new Event('loadeddata'));
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    act(() => {
      vi.advanceTimersByTime(4100);
    });

    expect(document.querySelector('video')).toBeNull();
    expect(onArrive).toHaveBeenCalledTimes(1);
  });

  it('primes the muted video from the Begin gesture while the first frame is pending, then pauses on presentation', () => {
    const { onAnnounce } = renderThreshold();
    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    const play = vi.fn(() => Promise.resolve());
    const pause = vi.fn();
    Object.defineProperty(video!, 'play', { value: play, configurable: true });
    Object.defineProperty(video!, 'pause', {
      value: pause,
      configurable: true,
    });
    const section = thresholdSection();
    Object.defineProperty(section, 'offsetHeight', { value: 2600 });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });

    // WebKit will not composite a seeked frame on a never-played muted video;
    // the Begin gesture is the sanctioned moment to prime it (project skill
    // contract). The prime must be muted, inline, and best-effort.
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    expect(onAnnounce).toHaveBeenCalledWith('Preparing the entrance.');
    expect(play).toHaveBeenCalledTimes(1);
    expect(video!.muted).toBe(true);

    // The scrub design never plays the clip: the first presented frame pauses
    // the prime again, and the pending Begin is honoured immediately (this
    // environment has no programmatic scroll, so arrival is direct).
    fireEvent(video!, new Event('loadeddata'));
    expect(pause).toHaveBeenCalled();
    expect(thresholdSection().dataset['cinematicState']).toBe('arrived');
  });

  it('presents the terminal video frame before completing corridor arrival', () => {
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
    const animationFrames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });

    fireEvent.scroll(window);

    expect(onArrive).not.toHaveBeenCalled();
    expect(animationFrames).toHaveLength(1);

    animationFrames.shift()!(0);
    expect(video.currentTime).toBeCloseTo(7.95, 5);
    fireEvent(video, new Event('seeked'));
    expect(onArrive).not.toHaveBeenCalled();

    animationFrames.shift()!(16);
    expect(onArrive).not.toHaveBeenCalled();
    animationFrames.shift()!(32);

    expect(onArrive).toHaveBeenCalledTimes(1);
    expect(onAnnounce).toHaveBeenCalledWith(
      'You have arrived at the reading alcove.',
    );
  });
});
