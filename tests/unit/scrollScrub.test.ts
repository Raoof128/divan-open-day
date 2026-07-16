import { describe, expect, it, vi } from 'vitest';

import {
  ARRIVAL_PROGRESS,
  createSeekCoalescer,
  isArrival,
  progressToTime,
  scrubProgress,
} from '../../src/lib/cinematic/scrollScrub';

describe('scrubProgress', () => {
  it('is zero at the top of the corridor', () => {
    expect(scrubProgress(0, 2600, 800)).toBe(0);
  });

  it('is one once the corridor is fully scrolled', () => {
    expect(scrubProgress(1800, 2600, 800)).toBe(1);
  });

  it('maps the middle of the corridor proportionally', () => {
    expect(scrubProgress(900, 2600, 800)).toBeCloseTo(0.5);
  });

  it('clamps overscroll and negative scroll', () => {
    expect(scrubProgress(-40, 2600, 800)).toBe(0);
    expect(scrubProgress(99999, 2600, 800)).toBe(1);
  });

  it('never divides by zero on degenerate corridors', () => {
    expect(scrubProgress(10, 800, 800)).toBe(1);
  });
});

describe('progressToTime', () => {
  it('maps progress across the clip duration', () => {
    expect(progressToTime(0.5, 8)).toBeCloseTo(4);
  });

  it('holds a small margin before the exact end so the last frame stays seekable', () => {
    expect(progressToTime(1, 8)).toBeLessThanOrEqual(8);
    expect(progressToTime(1, 8)).toBeGreaterThan(7.5);
  });

  it('returns zero for invalid durations', () => {
    expect(progressToTime(0.5, Number.NaN)).toBe(0);
    expect(progressToTime(0.5, 0)).toBe(0);
  });
});

describe('isArrival', () => {
  it('fires only at the end of the corridor', () => {
    expect(isArrival(ARRIVAL_PROGRESS - 0.01)).toBe(false);
    expect(isArrival(ARRIVAL_PROGRESS)).toBe(true);
    expect(isArrival(1)).toBe(true);
  });
});

describe('createSeekCoalescer', () => {
  it('applies only the latest requested seek per frame', () => {
    const apply = vi.fn();
    const frames: (() => void)[] = [];
    const coalescer = createSeekCoalescer(apply, (callback) => {
      frames.push(callback);
      return frames.length;
    });

    coalescer.request(1);
    coalescer.request(2);
    coalescer.request(3.5);
    expect(apply).not.toHaveBeenCalled();
    frames.shift()?.();
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(3.5);
  });

  it('waits for the previous seek to settle before applying the next', () => {
    const apply = vi.fn();
    const frames: (() => void)[] = [];
    const coalescer = createSeekCoalescer(apply, (callback) => {
      frames.push(callback);
      return frames.length;
    });

    coalescer.request(1);
    frames.shift()!();
    expect(apply).toHaveBeenCalledWith(1);

    coalescer.request(2);
    frames.shift()?.();
    // The video has not reported `seeked` yet, so 2 must not apply.
    expect(apply).toHaveBeenCalledTimes(1);

    coalescer.settled();
    frames.shift()?.();
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply).toHaveBeenLastCalledWith(2);
  });

  it('cancel drops pending work and stops scheduling', () => {
    const apply = vi.fn();
    const frames: (() => void)[] = [];
    const coalescer = createSeekCoalescer(apply, (callback) => {
      frames.push(callback);
      return frames.length;
    });

    coalescer.request(4);
    coalescer.cancel();
    frames.shift()?.();
    expect(apply).not.toHaveBeenCalled();
  });
});
