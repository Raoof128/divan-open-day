import {
  MOTION_PREFERENCES,
  SESSION_STORAGE_KEYS,
  type MotionPreference,
} from '../../contracts/app';
import { POETS, type Poet } from '../../contracts/content';

const PUBLIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const RELEASE_SCOPED_KEYS = [
  SESSION_STORAGE_KEYS.releaseId,
  SESSION_STORAGE_KEYS.selectedPoet,
  SESSION_STORAGE_KEYS.hafezShuffle,
  SESSION_STORAGE_KEYS.rumiShuffle,
  SESSION_STORAGE_KEYS.currentPoemId,
] as const;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ApprovedIdsByPoet {
  readonly hafez: readonly string[];
  readonly rumi: readonly string[];
}

export interface RestoredSessionState {
  readonly selectedPoet: Poet | null;
  readonly currentPoemId: string | null;
  readonly shuffleIds: {
    readonly hafez: readonly string[] | null;
    readonly rumi: readonly string[] | null;
  };
  readonly motionPreference: MotionPreference | null;
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

function safeGet(storage: StorageAdapter, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: StorageAdapter, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage: StorageAdapter, key: string): boolean {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function clearReleaseScopedState(storage: StorageAdapter): void {
  for (const key of RELEASE_SCOPED_KEYS) {
    safeRemove(storage, key);
  }
}

function approvedIdSet(ids: readonly string[]): ReadonlySet<string> | null {
  if (!ids.every(isPublicId) || new Set(ids).size !== ids.length) {
    return null;
  }
  return new Set(ids);
}

function parseRemainingIds(
  rawValue: string,
  approvedIds: readonly string[],
): readonly string[] | null {
  const approved = approvedIdSet(approvedIds);
  if (approved === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (
      !Array.isArray(parsed) ||
      parsed.length > approved.size ||
      !parsed.every((id): id is string => isPublicId(id) && approved.has(id)) ||
      new Set(parsed).size !== parsed.length
    ) {
      return null;
    }
    return [...parsed];
  } catch {
    return null;
  }
}

function readShuffleIds(
  storage: StorageAdapter,
  poet: Poet,
  approvedIds: readonly string[],
): readonly string[] | null {
  const key =
    poet === 'hafez'
      ? SESSION_STORAGE_KEYS.hafezShuffle
      : SESSION_STORAGE_KEYS.rumiShuffle;
  const rawValue = safeGet(storage, key);
  if (rawValue === null) {
    return null;
  }
  const parsed = parseRemainingIds(rawValue, approvedIds);
  if (parsed === null) {
    safeRemove(storage, key);
  }
  return parsed;
}

function emptySessionState(
  motionPreference: MotionPreference | null,
): RestoredSessionState {
  return {
    selectedPoet: null,
    currentPoemId: null,
    shuffleIds: { hafez: null, rumi: null },
    motionPreference,
  };
}

export function restoreSessionState(
  storage: StorageAdapter,
  options: {
    readonly releaseId: string;
    readonly approvedIds: ApprovedIdsByPoet;
  },
): RestoredSessionState {
  const storedReleaseId = safeGet(storage, SESSION_STORAGE_KEYS.releaseId);
  const motionPreference = readLocalMotionPreference(storage);
  if (
    !isPublicId(options.releaseId) ||
    storedReleaseId !== options.releaseId ||
    approvedIdSet(options.approvedIds.hafez) === null ||
    approvedIdSet(options.approvedIds.rumi) === null
  ) {
    clearReleaseScopedState(storage);
    return emptySessionState(motionPreference);
  }

  const storedPoet = safeGet(storage, SESSION_STORAGE_KEYS.selectedPoet);
  const selectedPoet = isPoet(storedPoet) ? storedPoet : null;
  if (storedPoet !== null && selectedPoet === null) {
    safeRemove(storage, SESSION_STORAGE_KEYS.selectedPoet);
  }

  const hafezShuffle = readShuffleIds(
    storage,
    'hafez',
    options.approvedIds.hafez,
  );
  const rumiShuffle = readShuffleIds(storage, 'rumi', options.approvedIds.rumi);
  const storedPoemId = safeGet(storage, SESSION_STORAGE_KEYS.currentPoemId);
  const selectedApprovedIds =
    selectedPoet === null
      ? null
      : approvedIdSet(options.approvedIds[selectedPoet]);
  const currentPoemId =
    isPublicId(storedPoemId) && selectedApprovedIds?.has(storedPoemId) === true
      ? storedPoemId
      : null;
  if (storedPoemId !== null && currentPoemId === null) {
    safeRemove(storage, SESSION_STORAGE_KEYS.currentPoemId);
  }

  return {
    selectedPoet,
    currentPoemId,
    shuffleIds: { hafez: hafezShuffle, rumi: rumiShuffle },
    motionPreference,
  };
}

export function persistSessionRelease(
  storage: StorageAdapter,
  releaseId: string,
): boolean {
  if (!isPublicId(releaseId)) {
    return false;
  }
  if (safeGet(storage, SESSION_STORAGE_KEYS.releaseId) !== releaseId) {
    clearReleaseScopedState(storage);
  }
  return safeSet(storage, SESSION_STORAGE_KEYS.releaseId, releaseId);
}

export function persistSelectedPoet(
  storage: StorageAdapter,
  poet: Poet | null,
): boolean {
  if (poet === null) {
    return safeRemove(storage, SESSION_STORAGE_KEYS.selectedPoet);
  }
  return (
    isPoet(poet) && safeSet(storage, SESSION_STORAGE_KEYS.selectedPoet, poet)
  );
}

export function persistShuffleIds(
  storage: StorageAdapter,
  poet: Poet,
  remainingIds: readonly string[],
  approvedIds: readonly string[],
): boolean {
  if (!isPoet(poet)) {
    return false;
  }
  const approved = approvedIdSet(approvedIds);
  if (
    approved === null ||
    remainingIds.length > approved.size ||
    !remainingIds.every((id) => isPublicId(id) && approved.has(id)) ||
    new Set(remainingIds).size !== remainingIds.length
  ) {
    return false;
  }
  const key =
    poet === 'hafez'
      ? SESSION_STORAGE_KEYS.hafezShuffle
      : SESSION_STORAGE_KEYS.rumiShuffle;
  return safeSet(storage, key, JSON.stringify(remainingIds));
}

export function persistCurrentPoemId(
  storage: StorageAdapter,
  poemId: string | null,
  approvedIds: readonly string[],
): boolean {
  if (poemId === null) {
    return safeRemove(storage, SESSION_STORAGE_KEYS.currentPoemId);
  }
  const approved = approvedIdSet(approvedIds);
  return (
    approved !== null &&
    isPublicId(poemId) &&
    approved.has(poemId) &&
    safeSet(storage, SESSION_STORAGE_KEYS.currentPoemId, poemId)
  );
}

export function persistLocalMotionPreference(
  storage: StorageAdapter,
  motionPreference: MotionPreference,
): boolean {
  return (
    isMotionPreference(motionPreference) &&
    safeSet(storage, SESSION_STORAGE_KEYS.motionPreference, motionPreference)
  );
}

export function readLocalMotionPreference(
  storage: StorageAdapter,
): MotionPreference | null {
  const storedValue = safeGet(storage, SESSION_STORAGE_KEYS.motionPreference);
  if (storedValue === null) {
    return null;
  }
  if (!isMotionPreference(storedValue)) {
    safeRemove(storage, SESSION_STORAGE_KEYS.motionPreference);
    return null;
  }
  return storedValue;
}

export function sessionReleaseMatches(
  storage: StorageAdapter,
  releaseId: string,
): boolean {
  return (
    isPublicId(releaseId) &&
    safeGet(storage, SESSION_STORAGE_KEYS.releaseId) === releaseId
  );
}

export function readPersistedShuffleIds(
  storage: StorageAdapter,
  releaseId: string,
  poet: Poet,
  approvedIds: readonly string[],
): readonly string[] | null {
  if (!sessionReleaseMatches(storage, releaseId)) {
    return null;
  }
  return readShuffleIds(storage, poet, approvedIds);
}
