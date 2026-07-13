import { createHash } from 'node:crypto';
import { lstat, open } from 'node:fs/promises';

import { MAX_RELEASE_ASSET_BYTES } from '../../src/contracts/release';

const READ_CHUNK_BYTES = 64 * 1_024;
const INSPECTION_PREFIX_BYTES = 64;

export interface ReadBoundedAssetFileOptions {
  readonly filename: string;
  readonly declaredBytes: number;
  readonly label: string;
  readonly collectContents: boolean;
}

export interface BoundedAssetFile {
  readonly sha256: string;
  readonly contents: Uint8Array | null;
  readonly prefix: Uint8Array;
}

function assertAllowedSize(
  size: number,
  declaredBytes: number,
  label: string,
): void {
  if (size > MAX_RELEASE_ASSET_BYTES) {
    throw new Error(`Asset exceeds maximum before read for ${label}.`);
  }
  if (size <= 0) {
    throw new Error(`Asset size must be positive before read for ${label}.`);
  }
  if (size !== declaredBytes) {
    throw new Error(`Asset size mismatch before read for ${label}.`);
  }
}

export async function readBoundedAssetFile(
  options: ReadBoundedAssetFileOptions,
): Promise<BoundedAssetFile> {
  if (
    !Number.isSafeInteger(options.declaredBytes) ||
    options.declaredBytes <= 0 ||
    options.declaredBytes > MAX_RELEASE_ASSET_BYTES
  ) {
    throw new Error(`Invalid declared asset size for ${options.label}.`);
  }

  const pathStat = await lstat(options.filename);
  if (pathStat.isSymbolicLink() || !pathStat.isFile()) {
    throw new Error(
      `Symlinked or irregular asset is forbidden: ${options.label}.`,
    );
  }
  assertAllowedSize(pathStat.size, options.declaredBytes, options.label);

  const handle = await open(options.filename, 'r');
  try {
    const openedStat = await handle.stat();
    if (!openedStat.isFile()) {
      throw new Error(`Irregular opened asset is forbidden: ${options.label}.`);
    }
    assertAllowedSize(openedStat.size, options.declaredBytes, options.label);

    const contents = options.collectContents
      ? new Uint8Array(options.declaredBytes)
      : null;
    const scratch =
      contents === null
        ? new Uint8Array(Math.min(READ_CHUNK_BYTES, options.declaredBytes))
        : null;
    const hash = createHash('sha256');
    const prefix = new Uint8Array(
      Math.min(INSPECTION_PREFIX_BYTES, options.declaredBytes),
    );
    let offset = 0;
    while (offset < options.declaredBytes) {
      const length = Math.min(READ_CHUNK_BYTES, options.declaredBytes - offset);
      const target = contents ?? scratch;
      if (target === null) {
        throw new Error('Bounded asset reader did not allocate a read buffer.');
      }
      const targetOffset = contents === null ? 0 : offset;
      const { bytesRead } = await handle.read(
        target,
        targetOffset,
        length,
        offset,
      );
      if (bytesRead === 0) {
        throw new Error(`Asset changed while reading ${options.label}.`);
      }
      if (offset < prefix.byteLength) {
        const prefixLength = Math.min(bytesRead, prefix.byteLength - offset);
        prefix.set(
          target.subarray(targetOffset, targetOffset + prefixLength),
          offset,
        );
      }
      hash.update(target.subarray(targetOffset, targetOffset + bytesRead));
      offset += bytesRead;
    }

    const extra = new Uint8Array(1);
    if (
      (await handle.read(extra, 0, 1, options.declaredBytes)).bytesRead !== 0
    ) {
      throw new Error(`Asset changed while reading ${options.label}.`);
    }
    return { sha256: hash.digest('hex'), contents, prefix };
  } finally {
    await handle.close();
  }
}
