type RandomUint32Buffer = Uint32Array<ArrayBuffer>;

export interface RandomValuesSource {
  getRandomValues(target: RandomUint32Buffer): RandomUint32Buffer;
}

export class UnsupportedSecureRandomError extends Error {
  public readonly code = 'secure_random_unavailable' as const;

  public constructor() {
    super('Secure random selection is unavailable in this browser.');
    this.name = 'UnsupportedSecureRandomError';
  }
}

const UINT32_RANGE = 2 ** 32;

function browserRandomSource(): RandomValuesSource | null {
  if (
    typeof globalThis.crypto === 'undefined' ||
    typeof globalThis.crypto.getRandomValues !== 'function'
  ) {
    return null;
  }
  const browserCrypto = globalThis.crypto;
  return {
    getRandomValues(target) {
      return browserCrypto.getRandomValues(target);
    },
  };
}

export function secureRandomInt(
  maxExclusive: number,
  source?: RandomValuesSource | null,
): number {
  if (
    !Number.isInteger(maxExclusive) ||
    maxExclusive < 1 ||
    maxExclusive > UINT32_RANGE
  ) {
    throw new RangeError(
      'maxExclusive must be an integer from 1 through 2^32.',
    );
  }
  const resolvedSource = source === undefined ? browserRandomSource() : source;
  if (
    resolvedSource === null ||
    typeof resolvedSource.getRandomValues !== 'function'
  ) {
    throw new UnsupportedSecureRandomError();
  }

  const limit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  const valueBuffer: RandomUint32Buffer = new Uint32Array(1);
  let value: number;
  do {
    try {
      resolvedSource.getRandomValues(valueBuffer);
    } catch {
      throw new UnsupportedSecureRandomError();
    }
    value = valueBuffer[0] ?? 0;
  } while (value >= limit);

  return value % maxExclusive;
}
