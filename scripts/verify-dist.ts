import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ReleaseDescriptor } from '../src/contracts/release';
import { canonicalSha256, canonicalStringify } from '../src/lib/content/canonical';
import {
  assetManifestSchema,
  publicCorpusSchema,
  releaseDescriptorSchema,
} from '../src/lib/content/release';

export interface VerifyDistOptions {
  readonly distDir: string;
}

const PRIVATE_KEY_NAMES = new Set([
  'approvalrecordid',
  'approvedby',
  'authoringsha256',
  'culturalreviewerids',
  'editioncitation',
  'editionid',
  'englisheditorids',
  'evidencereference',
  'moralrightsnotes',
  'permissionrecordid',
  'persianliteraryreviewerids',
  'reviewerids',
  'rightsowner',
  'rightsreviewerids',
  'sourceeditorids',
  'translatorids',
]);
const FIXTURE_PATTERN =
  /TEST ONLY|NOT POETRY|NOT TRANSLATION|NOT INTERPRETATION|SYNTHETIC|(?:^|[-_/])fixture(?:[-_/]|$)/iu;
const REMOTE_URL_PATTERN =
  /(?:\bhttps?:\/\/|(?:^|[\s("'=])\/\/[A-Za-z0-9])/iu;
const PRIVATE_VALUE_PATTERN =
  /(?:^|[/\\])content-private(?:[/\\]|$)|\.ya?ml(?:$|[?#])|permission[_ -]?record|evidence[_ -]?reference/iu;
const MAX_JSON_BYTES = 20_000_000;

function normalizedKey(value: string): string {
  return value.replaceAll(/[_-]/gu, '').toLowerCase();
}

function inspectPublicValue(
  value: unknown,
  sourceName: string,
  fixtureForbidden: boolean,
  seen: Set<object>,
): void {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (REMOTE_URL_PATTERN.test(trimmed)) {
      throw new Error(`Remote resource URL leaked into ${sourceName}.`);
    }
    if (PRIVATE_VALUE_PATTERN.test(value)) {
      throw new Error(`Private authoring value leaked into ${sourceName}.`);
    }
    if (fixtureForbidden && FIXTURE_PATTERN.test(value)) {
      throw new Error(`Fixture sentinel leaked into a production distribution.`);
    }
    return;
  }

  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return;
  }

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      for (const entry of value) {
        inspectPublicValue(entry, sourceName, fixtureForbidden, seen);
      }
      return;
    }

    for (const [key, entry] of Object.entries(value)) {
      if (PRIVATE_KEY_NAMES.has(normalizedKey(key))) {
        throw new Error(`Private authoring key ${key} leaked into ${sourceName}.`);
      }
      inspectPublicValue(entry, sourceName, fixtureForbidden, seen);
    }
  } finally {
    seen.delete(value);
  }
}

async function readCanonicalJson(
  filename: string,
  fixtureForbidden: boolean,
): Promise<unknown> {
  const stat = await lstat(filename);
  if (stat.isSymbolicLink()) {
    throw new Error(`Symlinked distribution file is not allowed: ${filename}.`);
  }
  if (!stat.isFile() || stat.size > MAX_JSON_BYTES) {
    throw new Error(`Invalid distribution JSON file: ${filename}.`);
  }

  const raw = await readFile(filename, 'utf8');
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`Malformed JSON in ${filename}.`, { cause: error });
  }
  inspectPublicValue(value, filename, fixtureForbidden, new Set<object>());
  if (canonicalStringify(value) !== raw) {
    throw new Error(`Distribution JSON is not canonical and may be tampered: ${filename}.`);
  }
  return value;
}

async function walkDistribution(
  root: string,
  directory = root,
): Promise<readonly string[]> {
  const directoryStat = await lstat(directory);
  if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
    throw new Error('Distribution roots and directories must not be symlinks.');
  }

  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.toSorted((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlinked distribution entry is not allowed: ${relative}.`);
    }
    if (entry.isDirectory()) {
      files.push(...(await walkDistribution(root, absolute)));
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`Unexpected distribution entry: ${relative}.`);
    }
    files.push(relative);
  }
  return files;
}

function assertNoForbiddenFiles(files: readonly string[]): void {
  for (const file of files) {
    if (/\.map$/iu.test(file)) {
      throw new Error(`Source maps are forbidden in dist: ${file}.`);
    }
    if (/\.ya?ml$/iu.test(file)) {
      throw new Error(`YAML files are forbidden in dist: ${file}.`);
    }
    if (/(?:permission|evidence|content-private|rights-register)/iu.test(file)) {
      throw new Error(`Private permission or evidence file is forbidden in dist: ${file}.`);
    }
  }
}

function safeReferencedPath(distRoot: string, publicPath: string): string {
  if (!publicPath.startsWith('/') || publicPath.includes('\\')) {
    throw new Error('Release path must be a local root-relative path.');
  }
  const absolute = path.resolve(distRoot, publicPath.slice(1));
  const relative = path.relative(distRoot, absolute);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Release path escapes the distribution root.');
  }
  return absolute;
}

async function verifyAssetFiles(
  distRoot: string,
  assets: readonly {
    readonly path: string;
    readonly sha256: string;
    readonly bytes: number;
  }[],
): Promise<void> {
  for (const asset of assets) {
    const filename = safeReferencedPath(distRoot, `/${asset.path}`);
    const stat = await lstat(filename);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size !== asset.bytes) {
      throw new Error(`Asset size or file type mismatch for ${asset.path}.`);
    }
    const bytes = await readFile(filename);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== asset.sha256) {
      throw new Error(`Asset SHA-256 mismatch for ${asset.path}.`);
    }
  }
}

export async function verifyDist(
  options: VerifyDistOptions,
): Promise<ReleaseDescriptor> {
  const distRoot = await realpath(path.resolve(options.distDir));
  const files = await walkDistribution(distRoot);
  assertNoForbiddenFiles(files);

  const rawRelease = await readCanonicalJson(
    path.join(distRoot, 'release.json'),
    false,
  );
  const release = releaseDescriptorSchema.parse(rawRelease);
  const fixtureForbidden = release.buildProfile === 'production';
  const contentFilename = safeReferencedPath(distRoot, release.contentPath);
  const assetManifestFilename = safeReferencedPath(
    distRoot,
    release.assetManifestPath,
  );
  const rawCorpus = await readCanonicalJson(contentFilename, fixtureForbidden);
  const rawAssetManifest = await readCanonicalJson(
    assetManifestFilename,
    fixtureForbidden,
  );
  const corpus = publicCorpusSchema.parse(rawCorpus);
  const assetManifest = assetManifestSchema.parse(rawAssetManifest);

  if (corpus.releaseId !== release.releaseId || assetManifest.releaseId !== release.releaseId) {
    throw new Error('Release ID mismatch across public release artifacts.');
  }
  if (canonicalSha256(corpus) !== release.contentSha256) {
    throw new Error('Public corpus SHA-256 mismatch.');
  }
  if (canonicalSha256(assetManifest) !== release.assetManifestSha256) {
    throw new Error('Asset manifest SHA-256 mismatch.');
  }

  const hafezCount = corpus.items.filter((item) => item.poet === 'hafez').length;
  const rumiCount = corpus.items.filter((item) => item.poet === 'rumi').length;
  if (
    corpus.items.length !== release.itemCount ||
    hafezCount !== release.hafezCount ||
    rumiCount !== release.rumiCount
  ) {
    throw new Error('Release item counts do not match the public corpus.');
  }

  await verifyAssetFiles(distRoot, assetManifest.assets);
  const expectedFiles = new Set([
    'release.json',
    release.contentPath.slice(1),
    release.assetManifestPath.slice(1),
    ...assetManifest.assets.map((asset) => asset.path),
  ]);
  const unexpected = files.filter((file) => !expectedFiles.has(file));
  const missing = [...expectedFiles].filter((file) => !files.includes(file));
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error(
      `Unexpected or missing distribution files: ${[...unexpected, ...missing].join(', ')}.`,
    );
  }

  return release;
}

async function main(): Promise<void> {
  if (process.argv.length !== 2) {
    throw new Error('Usage: tsx scripts/verify-dist.ts');
  }
  const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const release = await verifyDist({ distDir: path.join(projectRoot, 'dist') });
  process.stdout.write(
    `Verified ${release.buildProfile} release ${release.releaseId} (${String(release.itemCount)} items).\n`,
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  path.resolve(invokedPath) === path.resolve(fileURLToPath(import.meta.url))
) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown dist verification failure.';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
