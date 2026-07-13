import type { CryptoLike } from './cacheTypes';

export function canonicalStringify(value: unknown): string {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Canonical JSON cannot contain non-finite numbers.');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalStringify(entry)).join(',')}]`;
  }
  if (typeof value !== 'object') {
    throw new TypeError('Canonical JSON contains an unsupported value.');
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`)
    .join(',')}}`;
}

export async function sha256(
  bytes: Uint8Array,
  crypto: CryptoLike,
): Promise<string> {
  const buffer = bytes.slice().buffer;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function responseFromBytes(
  bytes: Uint8Array,
  response: Response,
): Response {
  const headers = new Headers(response.headers);
  // Fetch exposes decoded bytes but can retain transfer/encoding metadata for
  // the wire representation. Replaying those headers with reconstructed bytes
  // would misdescribe the cached body and can break Cache matching.
  for (const name of [
    'accept-ranges',
    'connection',
    'content-encoding',
    'content-length',
    'content-range',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'set-cookie',
    'set-cookie2',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'vary',
  ]) {
    headers.delete(name);
  }
  return new Response(bytes.slice(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function parseJson(bytes: Uint8Array): unknown {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return JSON.parse(text) as unknown;
}

export function parseCanonicalJson(bytes: Uint8Array): unknown {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const parsed = JSON.parse(text) as unknown;
  if (canonicalStringify(parsed) !== text) {
    throw new Error('Release JSON must use the canonical public encoding.');
  }
  return parsed;
}
