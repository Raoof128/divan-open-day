import { useCallback, useEffect, useRef, useState } from 'react';

import { LiveRegion } from '../components/LiveRegion';
import { MotionControl } from '../components/MotionControl';
import { OfflineBadge } from '../components/OfflineBadge';
import { PoemResult } from '../components/PoemResult';
import { SkipLink } from '../components/SkipLink';
import type { DivanHistoryState, MotionPreference } from '../contracts/app';
import type { Poet } from '../contracts/content';
import {
  FOCUS_TARGETS,
  focusSceneTarget,
  type FocusTarget,
} from '../lib/accessibility/focus';
import {
  readSystemReducedMotion,
  REVEAL_DURATION_MS,
  resolveEffectiveMotion,
  subscribeToSystemReducedMotion,
} from '../lib/accessibility/motion';
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
import { ContextPage } from '../pages';
import { contextRoute } from '../pages/routes';
import {
  OFFLINE_STATUS_EVENT,
  parseOfflineStatusDetail,
  registerOfflineWorker,
  requestOfflineActivation,
} from '../sw-client/register';
import {
  createHistoryState,
  resolvePopHistoryState,
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

const SKIP_CONTROL_DELAY_MS = 100;

export interface AppServices {
  readonly loadRelease: () => Promise<VerifiedRelease>;
  readonly drawPoem: (poet: Poet) => DrawResult;
  readonly randomSource: RandomValuesSource | null;
  readonly registerOfflineWorker: typeof registerOfflineWorker;
  readonly requestOfflineActivation: typeof requestOfflineActivation;
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

function browserMatchMedia(): typeof window.matchMedia | undefined {
  try {
    return typeof window.matchMedia === 'function'
      ? window.matchMedia.bind(window)
      : undefined;
  } catch {
    return undefined;
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

function stateFromHistory(
  current: AppState,
  resolved: DivanHistoryState,
  release: VerifiedRelease,
  currentPoemId: string | null,
): AppState {
  const resultItem =
    currentPoemId === null
      ? undefined
      : release.itemsById.get(currentPoemId);
  const canRestoreResult =
    resolved.stage === 'result' &&
    resolved.selectedPoet !== null &&
    resultItem?.poet === resolved.selectedPoet;
  return {
    stage:
      resolved.stage === 'result' && !canRestoreResult
        ? 'intention'
        : resolved.stage,
    releaseId: resolved.releaseId,
    selectedPoet: resolved.selectedPoet,
    currentPoemId: canRestoreResult ? (resultItem?.id ?? null) : null,
    motionPreference: current.motionPreference,
    statusCode: null,
    errorCode: null,
  };
}

function approvedIdsForRelease(release: VerifiedRelease) {
  return {
    hafez: release.corpus.items
      .filter((item) => item.poet === 'hafez')
      .map((item) => item.id),
    rumi: release.corpus.items
      .filter((item) => item.poet === 'rumi')
      .map((item) => item.id),
  };
}

export function App({ services }: AppProps) {
  const loadRelease = services?.loadRelease ?? loadVerifiedRelease;
  const registerWorker =
    services?.registerOfflineWorker ?? registerOfflineWorker;
  const activateOfflineRelease =
    services?.requestOfflineActivation ?? requestOfflineActivation;
  const [state, setState] = useState<AppState>(() =>
    createInitialAppState(initialMotionPreference()),
  );
  const [verifiedRelease, setVerifiedRelease] =
    useState<VerifiedRelease | null>(null);
  const [blockingError, setBlockingError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [liveMessage, setLiveMessage] = useState('');
  const [offlineRegistration, setOfflineRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [offlineUpdateReleaseId, setOfflineUpdateReleaseId] =
    useState<string | null>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(() =>
    readSystemReducedMotion(browserMatchMedia()),
  );
  const effectiveMotion = resolveEffectiveMotion(
    state.motionPreference,
    systemReducedMotion,
  );
  const activeContextRoute = contextRoute(window.location.pathname);
  const verifiedReleaseRef = useRef<VerifiedRelease | null>(null);
  const bagsRef = useRef<Partial<Record<Poet, PoetShuffleBag>>>({});
  const pendingPoemIdRef = useRef<string | null>(null);
  const lastResultPoemIdRef = useRef<string | null>(null);
  const pendingCycleResetRef = useRef(false);
  const revealActiveRef = useRef(false);
  const resultTimerRef = useRef<number | null>(null);
  const skipTimerRef = useRef<number | null>(null);
  const previousStageRef = useRef(state.stage);
  const historyNavigationRef = useRef(false);
  const historyInitializedRef = useRef(false);
  const focusRequestRef = useRef<FocusTarget | null>(null);
  const lastSelectedPoetRef = useRef<Poet | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const lastOfflineStatusRef = useRef<string | null>(null);
  const offlineActiveReleaseIdRef = useRef<string | null>(null);

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
    return subscribeToSystemReducedMotion(
      browserMatchMedia(),
      setSystemReducedMotion,
    );
  }, []);

  useEffect(() => {
    const request = blockingError
      ? FOCUS_TARGETS.heading
      : focusRequestRef.current;
    if (request === null) {
      return;
    }
    focusSceneTarget(mainRef.current, request);
    focusRequestRef.current = null;
  }, [blockingError, state.stage]);

  useEffect(() => {
    let cancelled = false;
    void loadRelease()
      .then((release) => {
        if (cancelled) {
          return;
        }
        const approvedIds = approvedIdsForRelease(release);
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

        lastOfflineStatusRef.current = null;
        offlineActiveReleaseIdRef.current = null;
        setOfflineRegistration(null);
        setOfflineUpdateReleaseId(null);
        verifiedReleaseRef.current = release;
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
            lastSelectedPoetRef.current = restored.selectedPoet;
            lastResultPoemIdRef.current = restoredItem.id;
            return {
              ...welcome,
              stage: 'result',
              selectedPoet: restored.selectedPoet,
              currentPoemId: restoredItem.id,
            };
          }
          lastResultPoemIdRef.current = null;
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
    if (state.releaseId === null || state.stage === 'revealing') {
      return;
    }
    if (historyNavigationRef.current) {
      historyNavigationRef.current = false;
      historyInitializedRef.current = true;
      previousStageRef.current = state.stage;
      return;
    }
    if (!historyInitializedRef.current) {
      writeHistory(state, true);
      historyInitializedRef.current = true;
      previousStageRef.current = state.stage;
      return;
    }
    if (state.stage === previousStageRef.current) {
      return;
    }
    writeHistory(state, false);
    previousStageRef.current = state.stage;
  }, [state]);

  useEffect(() => {
    const handleOffline = () => {
      if (verifiedReleaseRef.current === null) {
        return;
      }
      if (
        offlineActiveReleaseIdRef.current !==
        verifiedReleaseRef.current.descriptor.releaseId
      ) {
        setLiveMessage(
          'You are offline. Offline access is still being prepared.',
        );
        return;
      }
      dispatch({ type: 'SET_STATUS', statusCode: 'offline_ready' });
      setLiveMessage('You are offline, but your poetry experience is ready.');
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [dispatch]);

  useEffect(() => {
    if (verifiedRelease === null) {
      return;
    }
    const expectedReleaseId = verifiedRelease.descriptor.releaseId;
    let active = true;
    lastOfflineStatusRef.current = null;
    offlineActiveReleaseIdRef.current = null;

    const handleOfflineStatus = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }
      const detail = parseOfflineStatusDetail(event.detail);
      if (
        detail === null ||
        (detail.releaseId !== null &&
          detail.releaseId !== expectedReleaseId)
      ) {
        return;
      }
      const key = `${detail.code}:${detail.releaseId ?? ''}:${detail.message}`;
      if (lastOfflineStatusRef.current === key) {
        return;
      }
      lastOfflineStatusRef.current = key;
      if (
        detail.code === 'update_ready' &&
        detail.releaseId === expectedReleaseId
      ) {
        setOfflineUpdateReleaseId(expectedReleaseId);
      } else if (
        detail.code === 'active' &&
        detail.releaseId === expectedReleaseId
      ) {
        offlineActiveReleaseIdRef.current = expectedReleaseId;
        setOfflineUpdateReleaseId(null);
      }
      setLiveMessage(detail.message);
    };

    window.addEventListener(OFFLINE_STATUS_EVENT, handleOfflineStatus);
    void registerWorker({
      eventTarget: window,
      expectedReleaseId,
    }).then((registration) => {
      if (active) {
        setOfflineRegistration(registration);
      }
    });
    return () => {
      active = false;
      window.removeEventListener(OFFLINE_STATUS_EVENT, handleOfflineStatus);
    };
  }, [registerWorker, verifiedRelease]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (state.releaseId === null || verifiedRelease === null) {
        return;
      }
      clearRevealTimers();
      revealActiveRef.current = false;
      pendingPoemIdRef.current = null;
      setShowSkip(false);
      historyNavigationRef.current = true;
      const resolved = resolvePopHistoryState(event.state, state.releaseId);
      if (resolved === null) {
        focusRequestRef.current = FOCUS_TARGETS.begin;
        const welcome = {
          ...createInitialAppState(state.motionPreference, 'welcome'),
          releaseId: state.releaseId,
        };
        writeHistory(welcome, true);
        setState(welcome);
        return;
      }
      const poetBeforeNavigation =
        state.selectedPoet ?? lastSelectedPoetRef.current;
      let resultPoemId = lastResultPoemIdRef.current;
      if (resolved.stage === 'result') {
        const resultItem =
          resultPoemId === null
            ? undefined
            : verifiedRelease.itemsById.get(resultPoemId);
        if (resultItem?.poet !== resolved.selectedPoet) {
          const storage = browserStorage('sessionStorage');
          const restored =
            storage === null
              ? null
              : restoreSessionState(storage, {
                  releaseId: verifiedRelease.descriptor.releaseId,
                  approvedIds: approvedIdsForRelease(verifiedRelease),
                });
          resultPoemId =
            restored?.selectedPoet === resolved.selectedPoet
              ? restored.currentPoemId
              : null;
        }
      }
      const nextState = stateFromHistory(
        state,
        resolved,
        verifiedRelease,
        resultPoemId,
      );
      if (nextState.selectedPoet !== null) {
        lastSelectedPoetRef.current = nextState.selectedPoet;
      }
      focusRequestRef.current =
        nextState.stage === 'welcome'
          ? FOCUS_TARGETS.begin
          : nextState.stage === 'choose_poet' && poetBeforeNavigation !== null
            ? FOCUS_TARGETS[poetBeforeNavigation]
            : nextState.stage === 'intention'
              ? FOCUS_TARGETS.reveal
              : null;
      setState(nextState);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [clearRevealTimers, state, verifiedRelease]);

  useEffect(() => () => clearRevealTimers(), [clearRevealTimers]);

  const completeReveal = useCallback(() => {
    if (!revealActiveRef.current || pendingPoemIdRef.current === null) {
      return;
    }
    const poemId = pendingPoemIdRef.current;
    lastResultPoemIdRef.current = poemId;
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
      skipTimerRef.current = window.setTimeout(
        () => setShowSkip(true),
        SKIP_CONTROL_DELAY_MS,
      );
      resultTimerRef.current = window.setTimeout(
        completeReveal,
        REVEAL_DURATION_MS[effectiveMotion],
      );
    } catch {
      setBlockingError(true);
      setLiveMessage('Secure verse selection is unavailable in this browser.');
    }
  }, [completeReveal, dispatch, effectiveMotion, services, state.selectedPoet, verifiedRelease]);

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
  if (activeContextRoute !== null) {
    scene = <ContextPage route={activeContextRoute} release={verifiedRelease} />;
  } else if (blockingError) {
    scene = (
      <BlockingErrorScene
        onRetry={() => {
          setBlockingError(false);
          verifiedReleaseRef.current = null;
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
          <WelcomeScene
            onBegin={() => {
              focusRequestRef.current = FOCUS_TARGETS.heading;
              dispatch({ type: 'BEGIN' });
            }}
          />
        );
        break;
      case 'choose_poet':
        scene = (
          <ChoosePoetScene
            onChoose={(poet) => {
              focusRequestRef.current = FOCUS_TARGETS.heading;
              lastSelectedPoetRef.current = poet;
              const storage = browserStorage('sessionStorage');
              if (storage !== null) {
                persistSelectedPoet(storage, poet);
                persistCurrentPoemId(storage, null, []);
              }
              lastResultPoemIdRef.current = null;
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
            reducedMotion={effectiveMotion === 'reduced'}
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
                focusRequestRef.current = FOCUS_TARGETS.reveal;
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
    <div
      className="app-shell"
      data-testid="app-shell"
      data-motion-preference={state.motionPreference}
      data-motion={effectiveMotion}
      data-context-route={activeContextRoute ?? undefined}
    >
      <SkipLink />
      <header className="utility-header">
        {activeContextRoute === null ? (
          <span className="utility-header__spacer" aria-hidden="true" />
        ) : (
          <a className="wordmark" href="/" aria-label="DIVAN home">
            DIVAN
          </a>
        )}
        {state.statusCode === 'offline_ready' ? <OfflineBadge /> : null}
        <MotionControl value={state.motionPreference} onChange={handleMotionChange} />
        {offlineUpdateReleaseId === null ? null : (
          <button
            type="button"
            onClick={() => {
              if (
                offlineRegistration === null ||
                !activateOfflineRelease(
                  offlineRegistration,
                  offlineUpdateReleaseId,
                )
              ) {
                setLiveMessage(
                  'The verified offline update could not be applied yet.',
                );
              }
            }}
          >
            Apply offline update
          </button>
        )}
      </header>
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {scene}
      </main>
      <LiveRegion message={liveMessage} />
    </div>
  );
}
