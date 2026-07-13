export interface RandomValuesSource {
  getRandomValues(target: Uint32Array): Uint32Array;
}

export class UnsupportedSecureRandomError extends Error {
  public readonly code = 'secure_random_unavailable' as const;

  public constructor() {
    super('Secure random selection is unavailable in this browser.');
    this.name = 'UnsupportedSecureRandomError';
  }
}

const UINT32_RANGE = 2 ** 32;

export function secureRandomInt(
  maxExclusive: number,
  source: RandomValuesSource | null | undefined = globalThis.crypto,
): number {
  if (
    !Number.isInteger(maxExclusive) ||
    maxExclusive < 1 ||
    maxExclusive > UINT32_RANGE
  ) {
    throw new RangeError('maxExclusive must be an integer from 1 through 2^32.');
  }
  if (source === null || typeof source?.getRandomValues !== 'function') {
    throw new UnsupportedSecureRandomError();
  }

  const limit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  const valueBuffer = new Uint32Array(1);
  let value: number;
  do {
    source.getRandomValues(valueBuffer);
    value = valueBuffer[0] ?? 0;
  } while (value >= limit);

  return value % maxExclusive;
}
