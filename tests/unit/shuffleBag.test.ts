import { describe, expect, it } from 'vitest';

import {
  createPoetShuffleBag,
  EmptyShuffleBagError,
  type DrawCandidate,
} from '../../src/lib/draw/shuffleBag';
import { SESSION_STORAGE_KEYS } from '../../src/contracts/app';
import type { RandomValuesSource } from '../../src/lib/draw/secureRandom';
import { persistSessionRelease, type StorageAdapter } from '../../src/lib/storage/session';

const RELEASE_ID = 'test-only-release';

function sourceFrom(values: readonly number[]): RandomValuesSource {
  let index = 0;
  return {
    getRandomValues(target) {
      const value = values[index];
      index += 1;
      if (value === undefined) {
        throw new Error('TEST ONLY random source exhausted.');
      }
      target[0] = value;
      return target;
    },
  };
}

class MemoryStorage implements StorageAdapter {
  public readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

const CANDIDATES: readonly DrawCandidate[] = [
  { id: 'hafez-one', poet: 'hafez', approved: true, active: true },
  { id: 'hafez-two', poet: 'hafez', approved: true, active: true },
  { id: 'hafez-three', poet: 'hafez', approved: true, active: true },
];

describe('per-poet shuffle bags', () => {
  it('returns every approved active ID once before exhaustion', () => {
    const bag = createPoetShuffleBag({
      poet: 'hafez',
      candidates: CANDIDATES,
      randomSource: sourceFrom([0, 0, 0, 0]),
    });

    const firstCycle = [bag.draw(), bag.draw(), bag.draw()];

    expect(new Set(firstCycle.map((draw) => draw.id))).toEqual(
      new Set(CANDIDATES.map((candidate) => candidate.id)),
    );
    expect(firstCycle.every((draw) => !draw.cycleReset)).toBe(true);
    expect(firstCycle.map((draw) => draw.remainingInCycle)).toEqual([2, 1, 0]);

    expect(bag.draw()).toMatchObject({
      cycleReset: true,
      announcementCode: 'cycle_reset',
      remainingInCycle: 2,
    });
  });

  it('excludes disabled, unapproved, and other-poet candidates', () => {
    const bag = createPoetShuffleBag({
      poet: 'rumi',
      candidates: [
        { id: 'rumi-one', poet: 'rumi', approved: true, active: true },
        { id: 'rumi-disabled', poet: 'rumi', approved: true, active: false },
        { id: 'rumi-unapproved', poet: 'rumi', approved: false, active: true },
        { id: 'hafez-one', poet: 'hafez', approved: true, active: true },
      ],
      randomSource: sourceFrom([0]),
    });

    expect(bag.draw().id).toBe('rumi-one');
  });

  it('fails closed with a typed error when no eligible item exists', () => {
    expect(() =>
      createPoetShuffleBag({
        poet: 'rumi',
        candidates: [
          { id: 'rumi-disabled', poet: 'rumi', approved: true, active: false },
        ],
        randomSource: sourceFrom([]),
      }),
    ).toThrow(EmptyShuffleBagError);
  });

  it('restores persisted remaining public IDs without reshuffling', () => {
    const storage = new MemoryStorage();
    persistSessionRelease(storage, RELEASE_ID);
    const firstBag = createPoetShuffleBag({
      poet: 'hafez',
      candidates: CANDIDATES,
      randomSource: sourceFrom([0, 0]),
      storage,
      releaseId: RELEASE_ID,
    });
    const first = firstBag.draw();
    const restoredBag = createPoetShuffleBag({
      poet: 'hafez',
      candidates: CANDIDATES,
      randomSource: sourceFrom([]),
      storage,
      releaseId: RELEASE_ID,
    });

    const second = restoredBag.draw();

    expect(second.id).not.toBe(first.id);
    expect(second.cycleReset).toBe(false);
    expect(second.remainingInCycle).toBe(1);
  });

  it('does not persist a stale bag after the active release changes', () => {
    const storage = new MemoryStorage();
    persistSessionRelease(storage, RELEASE_ID);
    const bag = createPoetShuffleBag({
      poet: 'hafez',
      candidates: CANDIDATES,
      randomSource: sourceFrom([0, 0]),
      storage,
      releaseId: RELEASE_ID,
    });

    persistSessionRelease(storage, 'next-release');
    bag.draw();

    expect(storage.values.has(SESSION_STORAGE_KEYS.hafezShuffle)).toBe(false);
  });
});
