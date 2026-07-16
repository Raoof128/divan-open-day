import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

import {
  readSaveData,
  resolveCinematicPlan,
  resolveMediaClass,
  type EffectiveMotion,
} from '../lib/cinematic/capability';
import {
  createSeekCoalescer,
  isArrival,
  progressToTime,
  scrubProgress,
} from '../lib/cinematic/scrollScrub';

const FIRST_FRAME_TIMEOUT_MS = 4000;

type ThresholdState = 'poster' | 'playing' | 'arrived';

export interface CinematicThresholdProps {
  readonly effectiveMotion: EffectiveMotion;
  readonly onArrive: () => void;
  readonly onAnnounce: (message: string) => void;
  readonly children: ReactNode;
}

export function CinematicThreshold({
  effectiveMotion,
  onArrive,
  onAnnounce,
  children,
}: CinematicThresholdProps) {
  const plan = useMemo(
    () =>
      resolveCinematicPlan({
        effectiveMotion,
        saveData: readSaveData(navigator),
        online: navigator.onLine,
        mediaClass: resolveMediaClass(window.innerWidth, window.innerHeight),
      }),
    [effectiveMotion],
  );

  const [thresholdState, setThresholdState] =
    useState<ThresholdState>('poster');
  const [videoFailed, setVideoFailed] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const arrivedRef = useRef(false);
  const pendingBeginRef = useRef(false);

  const scrubbing = plan.shouldLoadVideo && !videoFailed;

  const arrive = useCallback(() => {
    if (arrivedRef.current) {
      return;
    }
    arrivedRef.current = true;
    pendingBeginRef.current = false;
    setThresholdState('arrived');
    onArrive();
  }, [onArrive]);

  const traverseCorridor = useCallback(() => {
    const section = sectionRef.current;
    if (
      section === null ||
      section.offsetHeight <= window.innerHeight ||
      typeof section.scrollIntoView !== 'function'
    ) {
      arrive();
      return;
    }

    onAnnounce('Entering the reading alcove.');
    section.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [arrive, onAnnounce]);

  const requestEntrance = useCallback(() => {
    if (arrivedRef.current) {
      return;
    }
    if (!scrubbing) {
      arrive();
      return;
    }
    if (thresholdState !== 'playing') {
      pendingBeginRef.current = true;
      onAnnounce('Preparing the entrance.');
      return;
    }
    traverseCorridor();
  }, [arrive, onAnnounce, scrubbing, thresholdState, traverseCorridor]);

  const handleClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const target = event.target;
      if (
        !(target instanceof Element) ||
        target.closest('[data-cinematic-begin]') === null
      ) {
        return;
      }
      event.preventDefault();
      requestEntrance();
    },
    [requestEntrance],
  );

  // First-frame gate: the poster stays until the video genuinely presents a
  // decoded frame; a missing frame within the timeout demotes to poster-only.
  useEffect(() => {
    if (!scrubbing) {
      return;
    }
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    let cancelled = false;
    const presented = () => {
      if (!cancelled) {
        setThresholdState((state) => (state === 'poster' ? 'playing' : state));
      }
    };
    const fail = () => {
      if (!cancelled) {
        setVideoFailed(true);
      }
    };
    const timeout = window.setTimeout(fail, FIRST_FRAME_TIMEOUT_MS);
    const onLoadedData = () => {
      window.clearTimeout(timeout);
      if (typeof video.requestVideoFrameCallback === 'function') {
        video.requestVideoFrameCallback(presented);
        // Painting a frame requires a decode request; a paused scrubbed video
        // gets one from an initial zero seek.
        video.currentTime = 0.001;
      } else {
        presented();
      }
    };
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('error', fail);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('error', fail);
    };
  }, [scrubbing]);

  // If Begin was pressed while the first frame was still decoding, honour the
  // request as soon as the cinematic is ready. Poster-only fallbacks enter
  // directly so a failed or disabled video can never trap the visitor.
  useEffect(() => {
    if (!pendingBeginRef.current) {
      return;
    }
    if (!scrubbing) {
      arrive();
      return;
    }
    if (thresholdState === 'playing') {
      pendingBeginRef.current = false;
      traverseCorridor();
    }
  }, [arrive, scrubbing, thresholdState, traverseCorridor]);

  // Natural or automatic scroll drives the clip; seeks are coalesced to one
  // per frame and never queue behind an unfinished decode.
  useEffect(() => {
    if (thresholdState !== 'playing' || !scrubbing) {
      return;
    }
    const section = sectionRef.current;
    const video = videoRef.current;
    if (section === null || video === null) {
      return;
    }
    const coalescer = createSeekCoalescer((time) => {
      video.currentTime = time;
    });
    const onSeeked = () => coalescer.settled();
    video.addEventListener('seeked', onSeeked);
    const onScroll = () => {
      // A corridor that has not laid out (or cannot scroll) must never count
      // as travelled; arrival is earned by scrolling or by the Skip control.
      if (section.offsetHeight <= window.innerHeight) {
        return;
      }
      const progress = scrubProgress(
        window.scrollY,
        section.offsetHeight,
        window.innerHeight,
      );
      section.style.setProperty('--cinematic-progress', String(progress));
      coalescer.request(progressToTime(progress, video.duration));
      if (isArrival(progress) && !arrivedRef.current) {
        onAnnounce('You have arrived at the reading alcove.');
        arrive();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      video.removeEventListener('seeked', onSeeked);
      coalescer.cancel();
    };
  }, [thresholdState, scrubbing, arrive, onAnnounce]);

  return (
    <section
      ref={sectionRef}
      className="scene scene--welcome cinematic-threshold"
      data-scene="welcome"
      data-cinematic-state={videoFailed ? 'poster' : thresholdState}
      data-cinematic-scrub={thresholdState === 'playing' ? 'true' : undefined}
      onClickCapture={handleClickCapture}
    >
      <div className="cinematic-media" aria-hidden="true">
        <img
          className="cinematic-media__poster"
          src={plan.posterPath}
          alt=""
          decoding="async"
        />
        {scrubbing ? (
          <video
            ref={videoRef}
            className="cinematic-media__video"
            src={plan.videoPath}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
          />
        ) : null}
      </div>
      <div className="cinematic-corridor">
        <div className="cinematic-card">{children}</div>
      </div>
      {thresholdState === 'playing' ? (
        <button
          type="button"
          className="cinematic-skip"
          onClick={() => {
            pendingBeginRef.current = false;
            onAnnounce('Entrance skipped.');
            arrive();
          }}
        >
          Skip entrance
        </button>
      ) : null}
    </section>
  );
}
