import type { DivanHistoryState } from '../../contracts/app';
import {
  persistCurrentPoemId,
  persistSelectedPoet,
  type StorageAdapter,
} from '../storage/session';

const PUBLIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function browserSessionStorage(): StorageAdapter | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function currentReleaseId(): string | null {
  const value: unknown = window.history.state;
  if (typeof value !== 'object' || value === null || !('releaseId' in value)) {
    return null;
  }
  const releaseId = (value as { readonly releaseId?: unknown }).releaseId;
  return typeof releaseId === 'string' && PUBLIC_ID_PATTERN.test(releaseId)
    ? releaseId
    : null;
}

export function returnToPoetSelection(): void {
  const storage = browserSessionStorage();
  if (storage !== null) {
    persistSelectedPoet(storage, null);
    persistCurrentPoemId(storage, null, []);
  }

  const releaseId = currentReleaseId();
  if (releaseId === null) {
    window.history.back();
    return;
  }

  const target: DivanHistoryState = {
    stage: 'choose_poet',
    selectedPoet: null,
    releaseId,
  };

  try {
    window.history.pushState(target, '');
    window.dispatchEvent(new PopStateEvent('popstate', { state: target }));
  } catch {
    window.history.back();
  }
}
