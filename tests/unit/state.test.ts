import { describe, expect, it } from 'vitest';

import {
  appReducer,
  createInitialAppState,
  type AppEvent,
  type AppState,
} from '../../src/app/state';

const RELEASE_ID = 'test-only-release';

describe('appReducer', () => {
  it('advances only through the locked application stages', () => {
    const initial = createInitialAppState();
    const welcome = appReducer(initial, {
      type: 'RELEASE_READY',
      releaseId: RELEASE_ID,
    });
    const choose = appReducer(welcome, { type: 'BEGIN' });
    const intention = appReducer(choose, {
      type: 'CHOOSE_POET',
      poet: 'hafez',
    });
    const revealing = appReducer(intention, { type: 'REVEAL' });
    const result = appReducer(revealing, {
      type: 'SHOW_RESULT',
      poemId: 'hafez-one',
    });
    const resultAction = appReducer(result, { type: 'OPEN_RESULT_ACTION' });

    expect([
      initial.stage,
      welcome.stage,
      choose.stage,
      intention.stage,
      revealing.stage,
      result.stage,
      resultAction.stage,
    ]).toEqual([
      'boot',
      'welcome',
      'choose_poet',
      'intention',
      'revealing',
      'result',
      'result_action',
    ]);
    expect(resultAction).toMatchObject({
      releaseId: RELEASE_ID,
      selectedPoet: 'hafez',
      currentPoemId: 'hafez-one',
      motionPreference: 'system',
    });
    expect(Object.keys(resultAction).toSorted()).toEqual([
      'currentPoemId',
      'errorCode',
      'motionPreference',
      'releaseId',
      'selectedPoet',
      'stage',
      'statusCode',
    ]);
  });

  it('recovers an invalid result transition to intention without stale poem data', () => {
    const result = {
      stage: 'result',
      releaseId: RELEASE_ID,
      selectedPoet: 'rumi',
      currentPoemId: 'rumi-one',
      motionPreference: 'system',
      statusCode: null,
      errorCode: null,
      visitorIntention: 'must never survive reducer recovery',
    } as AppState & { readonly visitorIntention: string };

    const recovered = appReducer(result, {
      type: 'CHOOSE_POET',
      poet: 'hafez',
    });

    expect(recovered).toEqual({
      stage: 'intention',
      releaseId: RELEASE_ID,
      selectedPoet: 'rumi',
      currentPoemId: null,
      motionPreference: 'system',
      statusCode: null,
      errorCode: null,
    });
    expect(recovered).not.toHaveProperty('visitorIntention');
  });

  it('does not expose an injected poem ID when SHOW_RESULT occurs too early', () => {
    const choose = appReducer(
      appReducer(
        appReducer(createInitialAppState(), {
          type: 'RELEASE_READY',
          releaseId: RELEASE_ID,
        }),
        { type: 'BEGIN' },
      ),
      { type: 'SHOW_RESULT', poemId: 'hafez-one' },
    );

    expect(choose.stage).toBe('choose_poet');
    expect(choose.currentPoemId).toBeNull();
  });

  it('falls back to welcome when required release or poet context is corrupt', () => {
    const corrupt = {
      stage: 'result',
      releaseId: '../private-release',
      selectedPoet: 'unknown',
      currentPoemId: 'private-poem',
      motionPreference: 'unknown',
      statusCode: 'raw server text',
      errorCode: 'stack trace',
    } as unknown as AppState;

    expect(appReducer(corrupt, { type: 'OPEN_RESULT_ACTION' })).toEqual(
      createInitialAppState('system', 'welcome'),
    );
  });

  it('updates reduced-motion preference without changing the active stage', () => {
    const welcome = appReducer(createInitialAppState(), {
      type: 'RELEASE_READY',
      releaseId: RELEASE_ID,
    });

    expect(
      appReducer(welcome, {
        type: 'SET_MOTION_PREFERENCE',
        motionPreference: 'reduced',
      }),
    ).toEqual({ ...welcome, motionPreference: 'reduced' });
  });

  it('treats unknown runtime events as invalid instead of throwing', () => {
    const initial = createInitialAppState();
    const unknownEvent = {
      type: 'STORE_VISITOR_ID',
      id: 'visitor-1',
    } as unknown as AppEvent;

    expect(() => appReducer(initial, unknownEvent)).not.toThrow();
    expect(appReducer(initial, unknownEvent)).toEqual(initial);
  });
});
