import { describe, expect, it } from 'vitest';

import {
  persistCurrentPoemId,
  persistLocalMotionPreference,
  persistSelectedPoet,
  persistSessionRelease,
  persistShuffleIds,
  readLocalMotionPreference,
  restoreSessionState,
  type StorageAdapter,
} from '../../src/lib/storage/session';
import { SESSION_STORAGE_KEYS } from '../../src/contracts/app';

const RELEASE_ID = 'test-only-release';
const APPROVED_IDS = {
  hafez: ['hafez-one', 'hafez-two'],
  rumi: ['rumi-one', 'rumi-two'],
} as const;

class RecordingStorage implements StorageAdapter {
  public readonly values = new Map<string, string>();
  public readonly touched = new Set<string>();
  public shouldThrow = false;

  public getItem(key: string): string | null {
    this.touched.add(key);
    if (this.shouldThrow) {
      throw new Error('TEST ONLY storage read failure.');
    }
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.touched.add(key);
    if (this.shouldThrow) {
      throw new Error('TEST ONLY storage write failure.');
    }
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.touched.add(key);
    if (this.shouldThrow) {
      throw new Error('TEST ONLY storage removal failure.');
    }
    this.values.delete(key);
  }
}

function seedValidSession(storage: RecordingStorage): void {
  storage.values.set(SESSION_STORAGE_KEYS.releaseId, RELEASE_ID);
  storage.values.set(SESSION_STORAGE_KEYS.selectedPoet, 'hafez');
  storage.values.set(
    SESSION_STORAGE_KEYS.hafezShuffle,
    JSON.stringify(['hafez-two']),
  );
  storage.values.set(
    SESSION_STORAGE_KEYS.rumiShuffle,
    JSON.stringify(['rumi-two', 'rumi-one']),
  );
  storage.values.set(SESSION_STORAGE_KEYS.currentPoemId, 'hafez-one');
  storage.values.set(SESSION_STORAGE_KEYS.motionPreference, 'reduced');
}

describe('session storage domain', () => {
  it('restores only matching public release and content identifiers', () => {
    const storage = new RecordingStorage();
    seedValidSession(storage);

    expect(
      restoreSessionState(storage, {
        releaseId: RELEASE_ID,
        approvedIds: APPROVED_IDS,
      }),
    ).toEqual({
      selectedPoet: 'hafez',
      currentPoemId: 'hafez-one',
      shuffleIds: {
        hafez: ['hafez-two'],
        rumi: ['rumi-two', 'rumi-one'],
      },
      motionPreference: 'reduced',
    });
    expect([...storage.touched].toSorted()).toEqual(
      Object.values(SESSION_STORAGE_KEYS).toSorted(),
    );
  });

  it('removes stale release-scoped state while retaining local motion state', () => {
    const storage = new RecordingStorage();
    seedValidSession(storage);
    storage.values.set(SESSION_STORAGE_KEYS.releaseId, 'old-release');

    expect(
      restoreSessionState(storage, {
        releaseId: RELEASE_ID,
        approvedIds: APPROVED_IDS,
      }),
    ).toEqual({
      selectedPoet: null,
      currentPoemId: null,
      shuffleIds: { hafez: null, rumi: null },
      motionPreference: 'reduced',
    });
    expect(storage.values.has(SESSION_STORAGE_KEYS.releaseId)).toBe(false);
    expect(storage.values.has(SESSION_STORAGE_KEYS.selectedPoet)).toBe(false);
    expect(storage.values.has(SESSION_STORAGE_KEYS.hafezShuffle)).toBe(false);
    expect(storage.values.has(SESSION_STORAGE_KEYS.rumiShuffle)).toBe(false);
    expect(storage.values.has(SESSION_STORAGE_KEYS.currentPoemId)).toBe(false);
    expect(storage.values.get(SESSION_STORAGE_KEYS.motionPreference)).toBe(
      'reduced',
    );
  });

  it('removes malformed, duplicate, or unapproved public-ID data', () => {
    const storage = new RecordingStorage();
    seedValidSession(storage);
    storage.values.set(
      SESSION_STORAGE_KEYS.hafezShuffle,
      JSON.stringify(['hafez-one', 'hafez-one']),
    );
    storage.values.set(
      SESSION_STORAGE_KEYS.rumiShuffle,
      JSON.stringify(['rumi-private']),
    );
    storage.values.set(SESSION_STORAGE_KEYS.currentPoemId, '../private');

    expect(
      restoreSessionState(storage, {
        releaseId: RELEASE_ID,
        approvedIds: APPROVED_IDS,
      }),
    ).toMatchObject({
      currentPoemId: null,
      shuffleIds: { hafez: null, rumi: null },
    });
    expect(storage.values.has(SESSION_STORAGE_KEYS.hafezShuffle)).toBe(false);
    expect(storage.values.has(SESSION_STORAGE_KEYS.rumiShuffle)).toBe(false);
    expect(storage.values.has(SESSION_STORAGE_KEYS.currentPoemId)).toBe(false);
  });

  it('fails safely when the storage adapter throws', () => {
    const storage = new RecordingStorage();
    storage.shouldThrow = true;

    expect(() =>
      restoreSessionState(storage, {
        releaseId: RELEASE_ID,
        approvedIds: APPROVED_IDS,
      }),
    ).not.toThrow();
    expect(
      restoreSessionState(storage, {
        releaseId: RELEASE_ID,
        approvedIds: APPROVED_IDS,
      }),
    ).toEqual({
      selectedPoet: null,
      currentPoemId: null,
      shuffleIds: { hafez: null, rumi: null },
      motionPreference: null,
    });
  });

  it('persists only validated values under the six approved session keys', () => {
    const storage = new RecordingStorage();

    expect(persistSessionRelease(storage, RELEASE_ID)).toBe(true);
    expect(persistSelectedPoet(storage, 'rumi')).toBe(true);
    expect(
      persistShuffleIds(storage, 'rumi', ['rumi-two'], APPROVED_IDS.rumi),
    ).toBe(true);
    expect(persistCurrentPoemId(storage, 'rumi-one', APPROVED_IDS.rumi)).toBe(
      true,
    );
    expect(persistSessionRelease(storage, '../private')).toBe(false);
    expect(
      persistShuffleIds(storage, 'rumi', ['rumi-private'], APPROVED_IDS.rumi),
    ).toBe(false);
    expect(
      [...storage.touched].every((key) =>
        Object.values(SESSION_STORAGE_KEYS).includes(
          key as (typeof SESSION_STORAGE_KEYS)[keyof typeof SESSION_STORAGE_KEYS],
        ),
      ),
    ).toBe(true);
  });

  it('clears prior release-scoped values before activating a new release', () => {
    const storage = new RecordingStorage();
    seedValidSession(storage);

    expect(persistSessionRelease(storage, 'next-release')).toBe(true);

    expect(storage.values.get(SESSION_STORAGE_KEYS.releaseId)).toBe(
      'next-release',
    );
    expect(storage.values.has(SESSION_STORAGE_KEYS.selectedPoet)).toBe(false);
    expect(storage.values.has(SESSION_STORAGE_KEYS.hafezShuffle)).toBe(false);
    expect(storage.values.has(SESSION_STORAGE_KEYS.rumiShuffle)).toBe(false);
    expect(storage.values.has(SESSION_STORAGE_KEYS.currentPoemId)).toBe(false);
    expect(storage.values.get(SESSION_STORAGE_KEYS.motionPreference)).toBe(
      'reduced',
    );
  });
});

describe('local motion preference storage', () => {
  it('uses only the approved motion key and removes malformed values', () => {
    const storage = new RecordingStorage();

    expect(persistLocalMotionPreference(storage, 'full')).toBe(true);
    expect(readLocalMotionPreference(storage)).toBe('full');
    storage.values.set(SESSION_STORAGE_KEYS.motionPreference, 'visitor-123');
    expect(readLocalMotionPreference(storage)).toBeNull();
    expect(storage.values.has(SESSION_STORAGE_KEYS.motionPreference)).toBe(
      false,
    );
    expect([...storage.touched]).toEqual([
      SESSION_STORAGE_KEYS.motionPreference,
    ]);
  });
});
