import {
  APP_STAGES,
  type AppStage,
  type DivanHistoryState,
} from '../contracts/app';
import { POETS, type Poet } from '../contracts/content';
import type { AppState } from './state';

const PUBLIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const HISTORY_KEYS = ['releaseId', 'selectedPoet', 'stage'] as const;
const DURABLE_HISTORY_STAGES = [
  'welcome',
  'choose_poet',
  'intention',
  'result',
] as const satisfies readonly AppStage[];

function isPublicId(value: unknown): value is string {
  return typeof value === 'string' && PUBLIC_ID_PATTERN.test(value);
}

function isPoetOrNull(value: unknown): value is Poet | null {
  return value === null || POETS.some((poet) => poet === value);
}

function isAppStage(value: unknown): value is AppStage {
  return APP_STAGES.some((stage) => stage === value);
}

function isDurableHistoryStage(
  value: AppStage,
): value is (typeof DURABLE_HISTORY_STAGES)[number] {
  return DURABLE_HISTORY_STAGES.some((stage) => stage === value);
}

function hasCoherentPoet(
  stage: (typeof DURABLE_HISTORY_STAGES)[number],
  selectedPoet: Poet | null,
): boolean {
  return stage === 'welcome' || stage === 'choose_poet'
    ? selectedPoet === null
    : selectedPoet !== null;
}

function welcomeState(releaseId: string): DivanHistoryState {
  return { stage: 'welcome', selectedPoet: null, releaseId };
}

function parseHistoryState(
  value: unknown,
  expectedReleaseId: string,
): DivanHistoryState | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).toSorted();
  if (
    keys.length !== HISTORY_KEYS.length ||
    !HISTORY_KEYS.every((key, index) => key === keys[index]) ||
    record['releaseId'] !== expectedReleaseId ||
    !isPublicId(record['releaseId']) ||
    !isAppStage(record['stage']) ||
    !isDurableHistoryStage(record['stage']) ||
    !isPoetOrNull(record['selectedPoet'])
  ) {
    return null;
  }

  if (!hasCoherentPoet(record['stage'], record['selectedPoet'])) {
    return null;
  }

  return {
    stage: record['stage'],
    selectedPoet: record['selectedPoet'],
    releaseId: record['releaseId'],
  };
}

export function createHistoryState(state: AppState): DivanHistoryState | null {
  if (
    !isPublicId(state.releaseId) ||
    !isAppStage(state.stage) ||
    !isDurableHistoryStage(state.stage) ||
    !isPoetOrNull(state.selectedPoet)
  ) {
    return null;
  }
  if (!hasCoherentPoet(state.stage, state.selectedPoet)) {
    return null;
  }

  return {
    stage: state.stage,
    selectedPoet: state.selectedPoet,
    releaseId: state.releaseId,
  };
}

export function resolvePopHistoryState(
  value: unknown,
  releaseId: string,
): DivanHistoryState | null {
  return parseHistoryState(value, releaseId);
}

export function resolveBackHistoryState(
  value: unknown,
  releaseId: string,
): DivanHistoryState {
  const parsed = parseHistoryState(value, releaseId);
  if (
    parsed !== null &&
    (parsed.stage === 'result' || parsed.stage === 'result_action') &&
    parsed.selectedPoet !== null
  ) {
    return { ...parsed, stage: 'intention' };
  }
  if (parsed?.stage === 'intention' && parsed.selectedPoet !== null) {
    return { ...parsed, stage: 'choose_poet', selectedPoet: null };
  }
  return welcomeState(releaseId);
}

export function resolveDirectHistoryState(
  _value: unknown,
  releaseId: string,
): DivanHistoryState {
  return welcomeState(releaseId);
}
