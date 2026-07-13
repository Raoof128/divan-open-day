import { useCallback, useEffect, useRef, useState } from 'react';

import { LiveRegion } from '../components/LiveRegion';
import { MotionControl } from '../components/MotionControl';
import { PoemResult } from '../components/PoemResult';
import { SkipLink } from '../components/SkipLink';
import type { MotionPreference } from '../contracts/app';
import type { Poet } from '../contracts/content';
import {
  createPoetShuffleBag,
  type DrawResult,
  type PoetShuffleBag,
} from '../lib/draw/shuffleBag';
import type { RandomValuesSource } from '../lib/draw/secureRandom';
import {
  persistCurrentPoemId,
  persistLocalMotionPreference,
  persistSelectedPoet,
  persistSessionRelease,
  readLocalMotionPreference,
  restoreSessionState,
  type StorageAdapter,
} from '../lib/storage/session';
import { BlockingErrorScene } from '../scenes/BlockingErrorScene';
import { BootScene } from '../scenes/BootScene';
import { ChoosePoetScene } from '../scenes/ChoosePoetScene';
import { IntentionScene } from '../scenes/IntentionScene';
import { RevealScene } from '../scenes/RevealScene';
import { WelcomeScene } from '../scenes/WelcomeScene';
import {
  createHistoryState,
  resolveBackHistoryState,
} from './history';
import {
  loadVerifiedRelease,
  type VerifiedRelease,
} from './runtime';
import {
  appReducer,
  createInitialAppState,
  type AppEvent,
  type AppState,
} from './state';

const REDUCED_REVEAL_MS = 150;
const FULL_REVEAL_MS = 1_600;
const SKIP_CONTROL_DELAY_MS = 250;

export interface AppServices {
  readonly loadRelease: () => Promise<VerifiedRelease>;
  readonly drawPoem: (poet: Poet) => DrawResult;
  readonly randomSource: RandomValuesSource | null;
}

export interface AppProps {
  readonly services?: Partial<AppServices>;
}

function browserStorage(kind: 'localStorage' | 'sessionStorage'): StorageAdapter | null {
  try {
    return window[kind];
  } catch {
    return null;
  }
}

function initialMotionPreference(): MotionPreference {
  const storage = browserStorage('localStorage');
  return storage === null ? 'system' : (readLocalMotionPreference(storage) ?? 'system');
}

function prefersReducedMotion(preference: MotionPreference): boolean {
  if (preference === 'reduced') {
    return true;
  }
  if (preference === 'full') {
    return false;
  }
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

function writeHistory(state: AppState, replace: boolean): void {
  const historyState = createHistoryState(state);
  if (historyState === null) {
    return;
  }
  try {
    if (replace) {
      window.history.replaceState(historyState, '');
    } else {
      window.history.pushState(historyState, '');
    }
  } catch {
    // History is a navigation enhancement; the active in-memory scene remains usable.
  }
}

function stateFromBack(
  current: AppState,
  releaseId: string,
): AppState {
  const resolved = resolveBackHistoryState(
    createHistoryState(current),
    releaseId,
  );
  return {
    stage: resolved.stage,
    releaseId,
    selectedPoet: resolved.selectedPoet,
    currentPoemId: null,
    motionPreference: current.motionPreference,
    statusCode: null,
    errorCode: null,
  };
}

export function App({ services }: AppProps) {
  const loadRelease = services?.loadRelease ?? loadVerifiedRelease;
  const [state, setState] = useState<AppState>(() =>
    createInitialAppState(initialMotionPreference()),
  );
  const [verifiedRelease, setVerifiedRelease] =
    useState<VerifiedRelease | null>(null);
  const [blockingError, setBlockingError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [liveMessage, setLiveMessage] = useState('');
  const [showSkip, setShowSkip] = useState(false);
  const bagsRef = useRef<Partial<Record<Poet, PoetShuffleBag>>>({});
  const pendingPoemIdRef = useRef<string | null>(null);
  const pendingCycleResetRef = useRef(false);
  const revealActiveRef = useRef(false);
  const resultTimerRef = useRef<number | null>(null);
  const skipTimerRef = useRef<number | null>(null);
  const previousStageRef = useRef(state.stage);
  const historyNavigationRef = useRef(false);

  const dispatch = useCallback((event: AppEvent) => {
    setState((current) => appReducer(current, event));
  }, []);

  const clearRevealTimers = useCallback(() => {
    if (resultTimerRef.current !== null) {
      window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
    if (skipTimerRef.current !== null) {
      window.clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadRelease()
      .then((release) => {
        if (cancelled) {
          return;
        }
        const approvedIds = {
          hafez: release.corpus.items
            .filter((item) => item.poet === 'hafez')
            .map((item) => item.id),
          rumi: release.corpus.items
            .filter((item) => item.poet === 'rumi')
            .map((item) => item.id),
        };
        const sessionStorage = browserStorage('sessionStorage');
        const restored =
          sessionStorage === null
            ? null
            : restoreSessionState(sessionStorage, {
                releaseId: release.descriptor.releaseId,
                approvedIds,
              });
        if (sessionStorage !== null) {
          persistSessionRelease(sessionStorage, release.descriptor.releaseId);
        }

        if (services?.drawPoem === undefined) {
          const candidates = release.corpus.items.map((item) => ({
            id: item.id,
            poet: item.poet,
            approved: true,
            active: true,
          }));
          const commonOptions = {
            candidates,
            ...(sessionStorage === null
              ? {}
              : {
                  storage: sessionStorage,
                  releaseId: release.descriptor.releaseId,
                }),
            ...(services?.randomSource === undefined
              ? {}
              : { randomSource: services.randomSource }),
          };
          bagsRef.current = {
            hafez: createPoetShuffleBag({ poet: 'hafez', ...commonOptions }),
            rumi: createPoetShuffleBag({ poet: 'rumi', ...commonOptions }),
          };
        }

        setVerifiedRelease(release);
        setState((current) => {
          const welcome = appReducer(
            createInitialAppState(
              restored?.motionPreference ?? current.motionPreference,
            ),
            {
              type: 'RELEASE_READY',
              releaseId: release.descriptor.releaseId,
            },
          );
          const restoredItem =
            restored?.currentPoemId === null ||
            restored?.currentPoemId === undefined
              ? null
              : release.itemsById.get(restored.currentPoemId);
          if (
            restored?.selectedPoet !== null &&
            restored?.selectedPoet !== undefined &&
            restoredItem?.poet === restored.selectedPoet
          ) {
            return {
              ...welcome,
              stage: 'result',
              selectedPoet: restored.selectedPoet,
              currentPoemId: restoredItem.id,
            };
          }
          return welcome;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setBlockingError(true);
          setLiveMessage('The experience could not finish loading.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadAttempt, loadRelease, services?.drawPoem, services?.randomSource]);

  useEffect(() => {
    if (state.stage === previousStageRef.current || state.releaseId === null) {
      return;
    }
    const replace =
      state.stage === 'welcome' || historyNavigationRef.current;
    writeHistory(state, replace);
    historyNavigationRef.current = false;
    previousStageRef.current = state.stage;
  }, [state]);

  useEffect(() => {
    const handleOffline = () => {
      dispatch({ type: 'SET_STATUS', statusCode: 'offline_ready' });
      setLiveMessage('You are offline, but your poetry experience is ready.');
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [dispatch]);

  useEffect(() => {
    const handlePopState = () => {
      if (state.releaseId === null) {
        return;
      }
      clearRevealTimers();
      revealActiveRef.current = false;
      pendingPoemIdRef.current = null;
      setShowSkip(false);
      historyNavigationRef.current = true;
      const next = stateFromBack(state, state.releaseId);
      const storage = browserStorage('sessionStorage');
      if (storage !== null) {
        persistSelectedPoet(storage, next.selectedPoet);
        persistCurrentPoemId(storage, null, []);
      }
      setState(next);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [clearRevealTimers, state]);

  useEffect(() => () => clearRevealTimers(), [clearRevealTimers]);

  const completeReveal = useCallback(() => {
    if (!revealActiveRef.current || pendingPoemIdRef.current === null) {
      return;
    }
    const poemId = pendingPoemIdRef.current;
    clearRevealTimers();
    revealActiveRef.current = false;
    pendingPoemIdRef.current = null;
    setShowSkip(false);
    const item = verifiedRelease?.itemsById.get(poemId);
    const storage = browserStorage('sessionStorage');
    if (verifiedRelease === null || item === undefined || storage === null) {
      if (item === undefined) {
        setBlockingError(true);
      }
    } else {
      const approvedIds = verifiedRelease.corpus.items
        .filter((candidate) => candidate.poet === item.poet)
        .map((candidate) => candidate.id);
      persistCurrentPoemId(storage, poemId, approvedIds);
    }
    dispatch({ type: 'SHOW_RESULT', poemId });
    setLiveMessage(
      pendingCycleResetRef.current
        ? 'Your verse is ready. A new no-repeat cycle has begun.'
        : 'Your verse is ready.',
    );
    pendingCycleResetRef.current = false;
  }, [clearRevealTimers, dispatch, verifiedRelease]);

  const handleReveal = useCallback(() => {
    if (
      revealActiveRef.current ||
      state.selectedPoet === null ||
      verifiedRelease === null
    ) {
      return;
    }
    try {
      const draw =
        services?.drawPoem?.(state.selectedPoet) ??
        bagsRef.current[state.selectedPoet]?.draw();
      const item = draw === undefined ? undefined : verifiedRelease.itemsById.get(draw.id);
      if (draw === undefined || item?.poet !== state.selectedPoet) {
        setBlockingError(true);
        return;
      }
      revealActiveRef.current = true;
      pendingPoemIdRef.current = draw.id;
      pendingCycleResetRef.current = draw.cycleReset;
      setShowSkip(false);
      setLiveMessage('Revealing your verse.');
      dispatch({ type: 'REVEAL' });
      const reduced = prefersReducedMotion(state.motionPreference);
      skipTimerRef.current = window.setTimeout(
        () => setShowSkip(true),
        SKIP_CONTROL_DELAY_MS,
      );
      resultTimerRef.current = window.setTimeout(
        completeReveal,
        reduced ? REDUCED_REVEAL_MS : FULL_REVEAL_MS,
      );
    } catch {
      setBlockingError(true);
      setLiveMessage('Secure verse selection is unavailable in this browser.');
    }
  }, [completeReveal, dispatch, services, state.motionPreference, state.selectedPoet, verifiedRelease]);

  const handleMotionChange = useCallback(
    (motionPreference: MotionPreference) => {
      const storage = browserStorage('localStorage');
      if (storage !== null) {
        persistLocalMotionPreference(storage, motionPreference);
      }
      dispatch({ type: 'SET_MOTION_PREFERENCE', motionPreference });
    },
    [dispatch],
  );

  let scene;
  if (blockingError) {
    scene = (
      <BlockingErrorScene
        onRetry={() => {
          setBlockingError(false);
          setVerifiedRelease(null);
          setState(createInitialAppState(state.motionPreference));
          setLoadAttempt((attempt) => attempt + 1);
        }}
      />
    );
  } else {
    switch (state.stage) {
      case 'boot':
        scene = <BootScene />;
        break;
      case 'welcome':
        scene = (
          <WelcomeScene onBegin={() => dispatch({ type: 'BEGIN' })} />
        );
        break;
      case 'choose_poet':
        scene = (
          <ChoosePoetScene
            onChoose={(poet) => {
              const storage = browserStorage('sessionStorage');
              if (storage !== null) {
                persistSelectedPoet(storage, poet);
              }
              dispatch({ type: 'CHOOSE_POET', poet });
            }}
          />
        );
        break;
      case 'intention':
        scene = state.selectedPoet === null ? (
          <BlockingErrorScene onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />
        ) : (
          <IntentionScene poet={state.selectedPoet} onReveal={handleReveal} />
        );
        break;
      case 'revealing':
        scene = state.selectedPoet === null ? (
          <BlockingErrorScene onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />
        ) : (
          <RevealScene
            poet={state.selectedPoet}
            reducedMotion={prefersReducedMotion(state.motionPreference)}
            showSkip={showSkip}
            onSkip={completeReveal}
          />
        );
        break;
      case 'result':
      case 'result_action': {
        const item =
          state.currentPoemId === null
            ? undefined
            : verifiedRelease?.itemsById.get(state.currentPoemId);
        scene =
          item === undefined ? (
            <BlockingErrorScene onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />
          ) : (
            <PoemResult
              item={item}
              audioUnavailable={state.statusCode === 'audio_unavailable'}
              onAudioError={() => {
                dispatch({ type: 'SET_STATUS', statusCode: 'audio_unavailable' });
                setLiveMessage('Persian audio is unavailable right now.');
              }}
              onRevealAnother={() => {
                const storage = browserStorage('sessionStorage');
                if (storage !== null) {
                  persistCurrentPoemId(storage, null, []);
                }
                historyNavigationRef.current = false;
                setState({
                  ...state,
                  stage: 'intention',
                  currentPoemId: null,
                  statusCode: null,
                  errorCode: null,
                });
              }}
            />
          );
        break;
      }
    }
  }

  return (
    <>
      <SkipLink />
      <header className="utility-header">
        <MotionControl value={state.motionPreference} onChange={handleMotionChange} />
      </header>
      <main id="main-content" tabIndex={-1}>
        {scene}
      </main>
      <LiveRegion message={liveMessage} />
    </>
  );
}
