import { describe, expect, it } from 'vitest';

import {
  createHistoryState,
  resolveBackHistoryState,
  resolveDirectHistoryState,
} from '../../src/app/history';
import type { AppState } from '../../src/app/state';

const RELEASE_ID = 'test-only-release';

function resultState(): AppState {
  return {
    stage: 'result',
    releaseId: RELEASE_ID,
    selectedPoet: 'hafez',
    currentPoemId: 'hafez-one',
    motionPreference: 'system',
    statusCode: null,
    errorCode: null,
  };
}

describe('browser history domain', () => {
  it('creates an exact three-field record with no poem or visitor data', () => {
    const historyState = createHistoryState(resultState());

    expect(historyState).toEqual({
      stage: 'result',
      selectedPoet: 'hafez',
      releaseId: RELEASE_ID,
    });
    expect(Object.keys(historyState ?? {}).toSorted()).toEqual([
      'releaseId',
      'selectedPoet',
      'stage',
    ]);
    expect(historyState).not.toHaveProperty('currentPoemId');
  });

  it('does not create a history record before a release is active', () => {
    expect(
      createHistoryState({
        ...resultState(),
        stage: 'boot',
        releaseId: null,
        selectedPoet: null,
        currentPoemId: null,
      }),
    ).toBeNull();
  });

  it('resolves Back from result to intention for the selected poet', () => {
    expect(
      resolveBackHistoryState(
        {
          stage: 'result',
          selectedPoet: 'rumi',
          releaseId: RELEASE_ID,
        },
        RELEASE_ID,
      ),
    ).toEqual({
      stage: 'intention',
      selectedPoet: 'rumi',
      releaseId: RELEASE_ID,
    });
  });

  it('resolves Back from intention to poet choice', () => {
    expect(
      resolveBackHistoryState(
        {
          stage: 'intention',
          selectedPoet: 'hafez',
          releaseId: RELEASE_ID,
        },
        RELEASE_ID,
      ),
    ).toEqual({
      stage: 'choose_poet',
      selectedPoet: null,
      releaseId: RELEASE_ID,
    });
  });

  it.each([
    null,
    { stage: 'result', selectedPoet: 'hafez', releaseId: 'stale-release' },
    {
      stage: 'result',
      selectedPoet: 'hafez',
      releaseId: RELEASE_ID,
      currentPoemId: 'hafez-one',
    },
    { stage: 'result', selectedPoet: null, releaseId: RELEASE_ID },
    { stage: 'private', selectedPoet: 'hafez', releaseId: RELEASE_ID },
  ])('resolves malformed or stale Back state to welcome', (value) => {
    expect(resolveBackHistoryState(value, RELEASE_ID)).toEqual({
      stage: 'welcome',
      selectedPoet: null,
      releaseId: RELEASE_ID,
    });
  });

  it('resolves a direct result entry to welcome even when its shape is valid', () => {
    expect(
      resolveDirectHistoryState(
        {
          stage: 'result',
          selectedPoet: 'hafez',
          releaseId: RELEASE_ID,
        },
        RELEASE_ID,
      ),
    ).toEqual({
      stage: 'welcome',
      selectedPoet: null,
      releaseId: RELEASE_ID,
    });
  });
});
