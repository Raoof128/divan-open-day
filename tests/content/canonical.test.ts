import { describe, expect, it } from 'vitest';

import {
  canonicalSha256,
  canonicalStringify,
} from '../../src/lib/content/canonical';

describe('canonical JSON', () => {
  it('orders object keys recursively while preserving array order', () => {
    const value = {
      list: [{ y: 2, x: 1 }, null],
      b: 2,
      a: { d: 4, c: 3 },
    };

    expect(canonicalStringify(value)).toBe(
      '{"a":{"c":3,"d":4},"b":2,"list":[{"x":1,"y":2},null]}',
    );
  });

  it('produces the expected SHA-256 digest for canonical JSON', () => {
    const value = {
      list: [{ y: 2, x: 1 }, null],
      b: 2,
      a: { d: 4, c: 3 },
    };

    expect(canonicalSha256(value)).toBe(
      'c611a1c674893f692c3d80aab8afea60b9ef6c05d8e002deff34d1d19c9d942b',
    );
  });

  it('rejects sparse arrays and symbol-keyed objects instead of hashing ambiguous JSON', () => {
    const sparse = new Array<unknown>(1);
    const symbolKeyed = { visible: true, [Symbol('private')]: true };

    expect(() => canonicalStringify(sparse)).toThrow(/sparse/u);
    expect(() => canonicalStringify(symbolKeyed)).toThrow(/symbol/u);
  });
});
