/**
 * Re-hashes every file recorded in source-lock.json and fails if any is missing
 * or altered. When no lock exists yet (no live fetch has run) it reports that
 * state and exits 0 — acquisition is an explicit, owner-gated step.
 *
 * Prints only paths, hashes and sizes; never poem text.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  hashFile,
  type SourceLock,
  type SourceLockEntry,
} from './fetch-sources';

/**
 * Lock paths are data. They must stay relative to the poetry root: no absolute
 * path, no traversal, no empty or dot segment, no backslash.
 */
function isContainedRelativePath(value: string): boolean {
  if (
    value === '' ||
    value.startsWith('/') ||
    value.includes('\\') ||
    /^[A-Za-z]:/u.test(value)
  ) {
    return false;
  }
  return value
    .split('/')
    .every(
      (segment) => segment.length > 0 && segment !== '.' && segment !== '..',
    );
}

export interface LockProblem {
  readonly file: string;
  readonly reason: string;
}

/**
 * Pure verifier: resolves and re-hashes each entry, returning a problem list.
 * File access is injected so this is unit-testable without a real archive.
 */
export async function verifyLock(
  lock: SourceLock,
  options: {
    readonly fileExists: (relativeFile: string) => boolean;
    readonly hashOf: (relativeFile: string) => Promise<string>;
    readonly sizeOf?: (relativeFile: string) => number;
  },
): Promise<LockProblem[]> {
  const problems: LockProblem[] = [];
  // A lock that records nothing proves nothing. Without this, deleting every
  // entry made the CLI print "passed: 0 artefacts intact" and exit 0 — the gate
  // reporting success for an absence of evidence.
  if (lock.entries.length === 0) {
    problems.push({
      file: 'source-lock.json',
      reason: 'lock records no artefacts; an empty lock cannot verify anything',
    });
    return problems;
  }
  for (const entry of lock.entries) {
    // entry.file is data, and it reaches resolve(poetryRoot, file) downstream.
    // Keep it a contained relative path so a hand-edited lock cannot aim the
    // verifier at an arbitrary readable file and report its digest.
    if (!isContainedRelativePath(entry.file)) {
      problems.push({
        file: entry.file,
        reason:
          'escapes the poetry root; lock paths must be relative and contained',
      });
      continue;
    }
    if (!options.fileExists(entry.file)) {
      problems.push({ file: entry.file, reason: 'missing on disk' });
      continue;
    }
    const actual = await options.hashOf(entry.file);
    if (actual !== entry.sha256) {
      problems.push({
        file: entry.file,
        reason: `sha256 mismatch (expected ${entry.sha256.slice(0, 12)}…, found ${actual.slice(0, 12)}…)`,
      });
    }
  }
  return problems;
}

function reportEntry(entry: SourceLockEntry): string {
  return [
    entry.source_id,
    entry.artifact_kind,
    entry.file,
    entry.sha256.slice(0, 16),
    `${String(entry.bytes)}B`,
    entry.content_type ?? 'n/a',
  ].join('  ');
}

async function main(): Promise<void> {
  const root = process.cwd();
  const lockPath = resolve(root, 'sources-private/poetry/source-lock.json');
  const poetryRoot = resolve(root, 'sources-private/poetry');

  if (!existsSync(lockPath)) {
    process.stdout.write(
      'No source-lock.json yet: no archival sources have been acquired. Run `pnpm poetry:fetch` on an approved host.\n',
    );
    return;
  }

  const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as SourceLock;
  const problems = await verifyLock(lock, {
    fileExists: (file) => existsSync(resolve(poetryRoot, file)),
    hashOf: (file) => hashFile(resolve(poetryRoot, file)),
  });

  for (const entry of lock.entries) {
    process.stdout.write(`  ${reportEntry(entry)}\n`);
  }

  if (problems.length > 0) {
    process.stderr.write('\nSource-lock verification FAILED:\n');
    for (const problem of problems) {
      process.stderr.write(`  - ${problem.file}: ${problem.reason}\n`);
    }
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `\nSource-lock verification passed: ${String(lock.entries.length)} artefacts intact.\n`,
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  import.meta.url.startsWith('file:') &&
  resolve(invokedPath) === resolve(fileURLToPath(import.meta.url))
) {
  main().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Unknown verification failure.';
    process.stderr.write(`Source-lock verification FAILED: ${message}\n`);
    process.exitCode = 1;
  });
}
