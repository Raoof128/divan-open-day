export const ARRIVAL_PROGRESS = 0.985;

// Seeking to the exact media duration can snap back to zero or report a
// blank frame in some decoders; holding a tiny margin keeps the settled
// alcove frame on screen for the handoff.
const END_MARGIN_SECONDS = 0.05;

export function scrubProgress(
  scrollTop: number,
  corridorHeight: number,
  viewportHeight: number,
): number {
  const travel = corridorHeight - viewportHeight;
  if (travel <= 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, scrollTop / travel));
}

export function progressToTime(progress: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.min(clamped * duration, duration - END_MARGIN_SECONDS);
}

export function isArrival(progress: number): boolean {
  return progress >= ARRIVAL_PROGRESS;
}

export interface SeekCoalescer {
  request(time: number): void;
  settled(): void;
  cancel(): void;
}

type FrameScheduler = (callback: () => void) => number;

// Coalesces high-frequency scroll positions into at most one currentTime
// write per animation frame, and never issues a new seek while the previous
// one is still decoding (the video reports that through `settled`).
export function createSeekCoalescer(
  apply: (time: number) => void,
  schedule: FrameScheduler = (callback) =>
    window.requestAnimationFrame(callback),
): SeekCoalescer {
  let pending: number | null = null;
  let scheduled = false;
  let seeking = false;
  let cancelled = false;

  const flush = () => {
    scheduled = false;
    if (cancelled || seeking || pending === null) {
      return;
    }
    const target = pending;
    pending = null;
    seeking = true;
    apply(target);
  };

  const ensureFrame = () => {
    if (!scheduled && !cancelled) {
      scheduled = true;
      schedule(flush);
    }
  };

  return {
    request(time: number) {
      if (cancelled) {
        return;
      }
      pending = time;
      ensureFrame();
    },
    settled() {
      seeking = false;
      if (pending !== null) {
        ensureFrame();
      }
    },
    cancel() {
      cancelled = true;
      pending = null;
    },
  };
}
