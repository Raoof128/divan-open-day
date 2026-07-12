import { createHash } from 'node:crypto';

function compareCodeUnits(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function serializeCanonical(value: unknown, ancestors: Set<object>): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Canonical JSON does not support non-finite numbers.');
    }

    return JSON.stringify(value);
  }

  if (typeof value !== 'object') {
    throw new TypeError(`Canonical JSON does not support ${typeof value} values.`);
  }

  if (ancestors.has(value)) {
    throw new TypeError('Canonical JSON does not support cyclic values.');
  }

  ancestors.add(value);

  try {
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError('Canonical JSON does not support symbol keys.');
    }

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) {
          throw new TypeError('Canonical JSON does not support sparse arrays.');
        }
      }

      return `[${value
        .map((entry) => serializeCanonical(entry, ancestors))
        .join(',')}]`;
    }

    const prototype = Object.getPrototypeOf(value) as object | null;
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Canonical JSON supports only plain objects.');
    }

    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort(compareCodeUnits)
      .map(
        (key) =>
          `${JSON.stringify(key)}:${serializeCanonical(record[key], ancestors)}`,
      );

    return `{${entries.join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalStringify(value: unknown): string {
  return serializeCanonical(value, new Set<object>());
}

export function canonicalSha256(value: unknown): string {
  return createHash('sha256').update(canonicalStringify(value), 'utf8').digest('hex');
}
