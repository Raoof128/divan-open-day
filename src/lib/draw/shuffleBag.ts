import type { Poet } from '../../contracts/content';
import {
  persistShuffleIds,
  readPersistedShuffleIds,
  sessionReleaseMatches,
  type StorageAdapter,
} from '../storage/session';
import { secureRandomInt, type RandomValuesSource } from './secureRandom';

const PUBLIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export interface DrawCandidate {
  readonly id: string;
  readonly poet: Poet;
  readonly approved: boolean;
  readonly active: boolean;
}

export interface DrawResult {
  readonly id: string;
  readonly cycleReset: boolean;
  readonly announcementCode: 'cycle_reset' | null;
  readonly remainingInCycle: number;
}

export interface PoetShuffleBag {
  draw(): DrawResult;
}

export class EmptyShuffleBagError extends Error {
  public readonly code = 'empty_corpus' as const;

  public constructor() {
    super('No approved active poems are available for this poet.');
    this.name = 'EmptyShuffleBagError';
  }
}

function shuffledIds(
  ids: readonly string[],
  randomSource: RandomValuesSource | null | undefined,
): string[] {
  const shuffled = [...ids];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomInt(index + 1, randomSource);
    const value = shuffled[index];
    shuffled[index] = shuffled[swapIndex] ?? shuffled[index]!;
    shuffled[swapIndex] = value!;
  }
  return shuffled;
}

export function createPoetShuffleBag(options: {
  readonly poet: Poet;
  readonly candidates: readonly DrawCandidate[];
  readonly randomSource?: RandomValuesSource | null;
  readonly storage?: StorageAdapter;
  readonly releaseId?: string;
}): PoetShuffleBag {
  const approvedActiveIds = [
    ...new Set(
      options.candidates
        .filter(
          (candidate) =>
            candidate.poet === options.poet &&
            candidate.approved &&
            candidate.active &&
            PUBLIC_ID_PATTERN.test(candidate.id),
        )
        .map((candidate) => candidate.id),
    ),
  ];
  if (approvedActiveIds.length === 0) {
    throw new EmptyShuffleBagError();
  }

  const canPersist =
    options.storage !== undefined &&
    options.releaseId !== undefined &&
    sessionReleaseMatches(options.storage, options.releaseId);
  const restoredIds = canPersist
    ? readPersistedShuffleIds(
        options.storage,
        options.releaseId,
        options.poet,
        approvedActiveIds,
      )
    : null;
  let remainingIds =
    restoredIds === null
      ? shuffledIds(approvedActiveIds, options.randomSource)
      : [...restoredIds];

  return {
    draw(): DrawResult {
      const cycleReset = remainingIds.length === 0;
      if (cycleReset) {
        remainingIds = shuffledIds(approvedActiveIds, options.randomSource);
      }
      const id = remainingIds.pop();
      if (id === undefined) {
        throw new EmptyShuffleBagError();
      }

      if (
        canPersist &&
        sessionReleaseMatches(options.storage, options.releaseId)
      ) {
        persistShuffleIds(
          options.storage,
          options.poet,
          remainingIds,
          approvedActiveIds,
        );
      }
      return {
        id,
        cycleReset,
        announcementCode: cycleReset ? 'cycle_reset' : null,
        remainingInCycle: remainingIds.length,
      };
    },
  };
}
