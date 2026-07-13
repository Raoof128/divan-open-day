/**
 * Defence-in-depth release gate: fails if any archival poetry source artefact,
 * private staging file, lock, registry, reviewer record, or machine candidate
 * report leaks into `dist/`. Complements the existing exact-file-set check in
 * scripts/verify-dist.ts (which already rejects unexpected files) by naming the
 * specific archival leak classes and scanning file CONTENTS for private paths.
 *
 * The short public corpus never contains full books; these types should be absent.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface BundleProblem {
  readonly file: string;
  readonly reason: string;
}

const FORBIDDEN_EXTENSIONS = new Set(['.epub', '.pdf', '.djvu', '.jsonl']);

const FORBIDDEN_BASENAMES = new Set([
  'source-lock.json',
  'registry.yaml',
  'rights-evidence.yaml',
  'reviewers.yaml',
  'editions.yaml',
  'rights-register.yaml',
  'source-rights-report.md',
]);

// Basename substrings that indicate leaked archival/staging/candidate material.
const FORBIDDEN_NAME_PATTERNS: readonly RegExp[] = [
  /_djvu\.txt$/u,
  /-candidates\.json$/u,
  /-(fa|en)\.jsonl$/u,
];

// Private path fragments that must never appear inside a shipped file.
const FORBIDDEN_CONTENT_FRAGMENTS: readonly string[] = [
  'sources-private/',
  'content-private/',
];

// Extensions whose text contents we scan for private path leakage.
const TEXT_SCAN_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.html',
  '.json',
  '.webmanifest',
  '.svg',
  '.txt',
  '.map',
]);

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

/** Scans a dist directory and returns every archival/private leak found. */
export async function inspectPublicBundle(
  distDir: string,
): Promise<BundleProblem[]> {
  const problems: BundleProblem[] = [];
  if (!existsSync(distDir)) {
    return problems;
  }

  for await (const file of walk(distDir)) {
    const rel = relative(distDir, file);
    const base = rel.split(/[/\\]/u).pop() ?? rel;
    const ext = extname(base).toLowerCase();

    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      problems.push({
        file: rel,
        reason: `forbidden archival extension ${ext}`,
      });
      continue;
    }
    if (FORBIDDEN_BASENAMES.has(base)) {
      problems.push({
        file: rel,
        reason: `private file must not ship: ${base}`,
      });
      continue;
    }
    if (FORBIDDEN_NAME_PATTERNS.some((pattern) => pattern.test(base))) {
      problems.push({
        file: rel,
        reason: `archival/staging/candidate artefact must not ship: ${base}`,
      });
      continue;
    }

    if (TEXT_SCAN_EXTENSIONS.has(ext)) {
      const info = await stat(file);
      if (info.size <= 5_000_000) {
        const contents = await readFile(file, 'utf8');
        for (const fragment of FORBIDDEN_CONTENT_FRAGMENTS) {
          if (contents.includes(fragment)) {
            problems.push({
              file: rel,
              reason: `references private path fragment "${fragment}"`,
            });
            break;
          }
        }
      }
    }
  }

  return problems.sort((a, b) => a.file.localeCompare(b.file));
}

async function main(): Promise<void> {
  const distDir = resolve(process.cwd(), 'dist');
  if (!existsSync(distDir)) {
    process.stdout.write('No dist/ to inspect (build first).\n');
    return;
  }
  const problems = await inspectPublicBundle(distDir);
  if (problems.length > 0) {
    process.stderr.write('Public bundle leak check FAILED:\n');
    for (const problem of problems) {
      process.stderr.write(`  - ${problem.file}: ${problem.reason}\n`);
    }
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    'Public bundle leak check passed: no archival source, staging, lock, reviewer, or candidate artefacts in dist.\n',
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
      error instanceof Error
        ? error.message
        : 'Unknown bundle inspection failure.';
    process.stderr.write(`Public bundle leak check FAILED: ${message}\n`);
    process.exitCode = 1;
  });
}
