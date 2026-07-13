import { describe, expect, it, vi } from 'vitest';

import {
  secureRandomInt,
  UnsupportedSecureRandomError,
  type RandomValuesSource,
} from '../../src/lib/draw/secureRandom';

function sourceFrom(values: readonly number[]): RandomValuesSource & {
  readonly calls: number;
} {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    getRandomValues(target) {
      const value = values[calls];
      calls += 1;
      if (value === undefined) {
        throw new Error('TEST ONLY random source exhausted.');
      }
      target[0] = value;
      return target;
    },
  };
}

describe('secureRandomInt', () => {
  it.each([0, -1, 1.5, 2 ** 32 + 1, Number.NaN])(
    'rejects invalid maxExclusive value %s',
    (maxExclusive) => {
      expect(() => secureRandomInt(maxExclusive, sourceFrom([0]))).toThrow(
        RangeError,
      );
    },
  );

  it('accepts the full 1..2^32 contract including both boundaries', () => {
    expect(secureRandomInt(1, sourceFrom([0xffffffff]))).toBe(0);
    expect(secureRandomInt(2 ** 32, sourceFrom([0xffffffff]))).toBe(
      0xffffffff,
    );
  });

  it('rejects the incomplete upper interval for a non-power-of-two range', () => {
    const source = sourceFrom([0xffffffff, 5]);

    expect(secureRandomInt(3, source)).toBe(2);
    expect(source.calls).toBe(2);
  });

  it('never falls back to Math.random when secure randomness is unavailable', () => {
    const mathRandom = vi
      .spyOn(Math, 'random')
      .mockImplementation(() => {
        throw new Error('Math.random must not be called.');
      });

    expect(() => secureRandomInt(2, null)).toThrow(
      UnsupportedSecureRandomError,
    );
    expect(mathRandom).not.toHaveBeenCalled();
  });

  it('returns a typed safe error code for unsupported browsers', () => {
    try {
      secureRandomInt(2, null);
      throw new Error('Expected unsupported secure randomness.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(UnsupportedSecureRandomError);
      expect(error).toMatchObject({ code: 'secure_random_unavailable' });
    }
  });
});
