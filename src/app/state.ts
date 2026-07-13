import type { AppStage, MotionPreference } from '../contracts/app';
import { MOTION_PREFERENCES } from '../contracts/app';
import type { Poet } from '../contracts/content';
import { POETS } from '../contracts/content';

export type AppStatusCode =
  'audio_unavailable' | 'cycle_reset' | 'offline_ready' | 'share_unavailable';

export type AppErrorCode = 'release_unavailable' | 'secure_random_unavailable';

const APP_STATUS_CODES = [
  'audio_unavailable',
  'cycle_reset',
  'offline_ready',
  'share_unavailable',
] as const satisfies readonly AppStatusCode[];
const APP_ERROR_CODES = [
  'release_unavailable',
  'secure_random_unavailable',
] as const satisfies readonly AppErrorCode[];
const PUBLIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export interface AppState {
  readonly stage: AppStage;
  readonly releaseId: string | null;
  readonly selectedPoet: Poet | null;
  readonly currentPoemId: string | null;
  readonly motionPreference: MotionPreference;
  readonly statusCode: AppStatusCode | null;
  readonly errorCode: AppErrorCode | null;
}

export type AppEvent =
  | { readonly type: 'RELEASE_READY'; readonly releaseId: string }
  | { readonly type: 'BEGIN' }
  | { readonly type: 'CHOOSE_POET'; readonly poet: Poet }
  | { readonly type: 'REVEAL' }
  | { readonly type: 'SHOW_RESULT'; readonly poemId: string }
  | { readonly type: 'OPEN_RESULT_ACTION' }
  | {
      readonly type: 'SET_MOTION_PREFERENCE';
      readonly motionPreference: MotionPreference;
    }
  | { readonly type: 'SET_STATUS'; readonly statusCode: AppStatusCode | null }
  | { readonly type: 'SET_ERROR'; readonly errorCode: AppErrorCode | null };

export function createInitialAppState(
  motionPreference: MotionPreference = 'system',
  stage: 'boot' | 'welcome' = 'boot',
): AppState {
  return {
    stage,
    releaseId: null,
    selectedPoet: null,
    currentPoemId: null,
    motionPreference: isMotionPreference(motionPreference)
      ? motionPreference
      : 'system',
    statusCode: null,
    errorCode: null,
  };
}

function isPublicId(value: unknown): value is string {
  return typeof value === 'string' && PUBLIC_ID_PATTERN.test(value);
}

function isPoet(value: unknown): value is Poet {
  return POETS.some((poet) => poet === value);
}

function isMotionPreference(value: unknown): value is MotionPreference {
  return MOTION_PREFERENCES.some((preference) => preference === value);
}

function isStatusCode(value: unknown): value is AppStatusCode | null {
  return (
    value === null ||
    APP_STATUS_CODES.some((statusCode) => statusCode === value)
  );
}

function isErrorCode(value: unknown): value is AppErrorCode | null {
  return (
    value === null || APP_ERROR_CODES.some((errorCode) => errorCode === value)
  );
}

function hasSafeFields(state: AppState): boolean {
  return (
    isMotionPreference(state.motionPreference) &&
    isStatusCode(state.statusCode) &&
    isErrorCode(state.errorCode)
  );
}

function isValidState(state: AppState): boolean {
  if (!hasSafeFields(state)) {
    return false;
  }

  switch (state.stage) {
    case 'boot':
      return (
        state.releaseId === null &&
        state.selectedPoet === null &&
        state.currentPoemId === null
      );
    case 'welcome':
      return (
        (state.releaseId === null || isPublicId(state.releaseId)) &&
        state.selectedPoet === null &&
        state.currentPoemId === null
      );
    case 'choose_poet':
      return (
        isPublicId(state.releaseId) &&
        state.selectedPoet === null &&
        state.currentPoemId === null
      );
    case 'intention':
    case 'revealing':
      return (
        isPublicId(state.releaseId) &&
        isPoet(state.selectedPoet) &&
        state.currentPoemId === null
      );
    case 'result':
    case 'result_action':
      return (
        isPublicId(state.releaseId) &&
        isPoet(state.selectedPoet) &&
        isPublicId(state.currentPoemId)
      );
  }
}

function copyState(
  state: AppState,
  overrides: Partial<AppState> = {},
): AppState {
  return {
    stage: overrides.stage === undefined ? state.stage : overrides.stage,
    releaseId:
      overrides.releaseId === undefined ? state.releaseId : overrides.releaseId,
    selectedPoet:
      overrides.selectedPoet === undefined
        ? state.selectedPoet
        : overrides.selectedPoet,
    currentPoemId:
      overrides.currentPoemId === undefined
        ? state.currentPoemId
        : overrides.currentPoemId,
    motionPreference:
      overrides.motionPreference === undefined
        ? state.motionPreference
        : overrides.motionPreference,
    statusCode:
      overrides.statusCode === undefined
        ? state.statusCode
        : overrides.statusCode,
    errorCode:
      overrides.errorCode === undefined ? state.errorCode : overrides.errorCode,
  };
}

function safeWelcome(state: AppState): AppState {
  const motionPreference = isMotionPreference(state.motionPreference)
    ? state.motionPreference
    : 'system';
  return createInitialAppState(motionPreference, 'welcome');
}

function recoverToNearestSafeState(state: AppState): AppState {
  if (!hasSafeFields(state)) {
    return safeWelcome(state);
  }

  if (state.stage === 'boot') {
    return createInitialAppState(state.motionPreference);
  }
  if (state.stage === 'welcome') {
    return copyState(state, {
      releaseId: isPublicId(state.releaseId) ? state.releaseId : null,
      selectedPoet: null,
      currentPoemId: null,
    });
  }
  if (!isPublicId(state.releaseId)) {
    return safeWelcome(state);
  }
  if (state.stage === 'choose_poet') {
    return copyState(state, {
      stage: 'choose_poet',
      selectedPoet: null,
      currentPoemId: null,
    });
  }
  if (!isPoet(state.selectedPoet)) {
    return copyState(state, {
      stage: 'choose_poet',
      selectedPoet: null,
      currentPoemId: null,
    });
  }
  return copyState(state, {
    stage: 'intention',
    selectedPoet: state.selectedPoet,
    currentPoemId: null,
  });
}

export function appReducer(state: AppState, event: AppEvent): AppState {
  if (!isValidState(state)) {
    return recoverToNearestSafeState(state);
  }

  switch (event.type) {
    case 'RELEASE_READY':
      if (state.stage === 'boot' && isPublicId(event.releaseId)) {
        return copyState(state, {
          stage: 'welcome',
          releaseId: event.releaseId,
        });
      }
      break;
    case 'BEGIN':
      if (state.stage === 'welcome' && isPublicId(state.releaseId)) {
        return copyState(state, { stage: 'choose_poet' });
      }
      break;
    case 'CHOOSE_POET':
      if (state.stage === 'choose_poet' && isPoet(event.poet)) {
        return copyState(state, {
          stage: 'intention',
          selectedPoet: event.poet,
          currentPoemId: null,
        });
      }
      break;
    case 'REVEAL':
      if (state.stage === 'intention') {
        return copyState(state, {
          stage: 'revealing',
          currentPoemId: null,
        });
      }
      break;
    case 'SHOW_RESULT':
      if (state.stage === 'revealing' && isPublicId(event.poemId)) {
        return copyState(state, {
          stage: 'result',
          currentPoemId: event.poemId,
        });
      }
      break;
    case 'OPEN_RESULT_ACTION':
      if (state.stage === 'result') {
        return copyState(state, { stage: 'result_action' });
      }
      break;
    case 'SET_MOTION_PREFERENCE':
      if (isMotionPreference(event.motionPreference)) {
        return copyState(state, {
          motionPreference: event.motionPreference,
        });
      }
      break;
    case 'SET_STATUS':
      if (isStatusCode(event.statusCode)) {
        return copyState(state, { statusCode: event.statusCode });
      }
      break;
    case 'SET_ERROR':
      if (isErrorCode(event.errorCode)) {
        return copyState(state, { errorCode: event.errorCode });
      }
      break;
  }

  return recoverToNearestSafeState(state);
}
