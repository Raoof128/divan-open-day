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
import { containsRemoteResource } from '../src/lib/content/remoteResource';
import {
  derivePrivateSourceValues,
  loadContentPrivate,
} from './content/loadContent';
import { readBoundedAssetFile } from './content/readAssetFile';

export interface VerifyDistOptions {
  readonly projectRoot: string;
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
const MAX_JSON_BYTES = 20_000_000;
const FIXTURE_AUDIO_BYTES = new TextEncoder().encode('TEST ONLY - NOT AUDIO');

function normalizedKey(value: string): string {
  return value.replaceAll(/[_-]/gu, '').toLowerCase();
}

function inspectPublicValue(
  value: unknown,
  sourceName: string,
  fixtureForbidden: boolean,
  privateValues: ReadonlySet<string>,
  seen: Set<object>,
): void {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (containsRemoteResource(trimmed)) {
      throw new Error(`Remote resource leaked into ${sourceName}.`);
    }
    if (privateValues.has(value) || privateValues.has(trimmed)) {
      throw new Error(`Source-derived private authoring value leaked into ${sourceName}.`);
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
        inspectPublicValue(
          entry,
          sourceName,
          fixtureForbidden,
          privateValues,
          seen,
        );
      }
      return;
    }

    for (const [key, entry] of Object.entries(value)) {
      if (PRIVATE_KEY_NAMES.has(normalizedKey(key))) {
        throw new Error(`Private authoring key ${key} leaked into ${sourceName}.`);
      }
      inspectPublicValue(
        entry,
        sourceName,
        fixtureForbidden,
        privateValues,
        seen,
      );
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
  inspectPublicValue(
    value,
    filename,
    fixtureForbidden,
    new Set<string>(),
    new Set<object>(),
  );
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
    readonly mimeType: string;
    readonly sha256: string;
    readonly bytes: number;
  }[],
  profile: 'fixture' | 'production',
  privateValues: ReadonlySet<string>,
): Promise<void> {
  for (const asset of assets) {
    const filename = safeReferencedPath(distRoot, `/${asset.path}`);
    const isTextAsset =
      asset.mimeType === 'application/manifest+json' ||
      asset.mimeType === 'image/svg+xml' ||
      asset.mimeType.startsWith('text/');
    const loaded = await readBoundedAssetFile({
      filename,
      declaredBytes: asset.bytes,
      label: asset.path,
      collectContents: isTextAsset,
    });
    if (loaded.sha256 !== asset.sha256) {
      throw new Error(`Asset SHA-256 mismatch for ${asset.path}.`);
    }
    if (asset.mimeType === 'audio/mpeg' || asset.mimeType === 'audio/ogg') {
      if (profile === 'fixture') {
        if (
          asset.bytes !== FIXTURE_AUDIO_BYTES.byteLength ||
          !loaded.prefix.every(
            (byte, index) => byte === FIXTURE_AUDIO_BYTES[index],
          )
        ) {
          throw new Error(
            `Fixture audio bytes must use the TEST ONLY - NOT AUDIO sentinel: ${asset.path}.`,
          );
        }
      } else {
        const isOgg =
          loaded.prefix.byteLength >= 4 &&
          loaded.prefix[0] === 0x4f &&
          loaded.prefix[1] === 0x67 &&
          loaded.prefix[2] === 0x67 &&
          loaded.prefix[3] === 0x53;
        const isMp3 =
          (loaded.prefix.byteLength >= 3 &&
            loaded.prefix[0] === 0x49 &&
            loaded.prefix[1] === 0x44 &&
            loaded.prefix[2] === 0x33) ||
          (loaded.prefix.byteLength >= 2 &&
            loaded.prefix[0] === 0xff &&
            (loaded.prefix[1]! & 0xe0) === 0xe0);
        if (
          (asset.mimeType === 'audio/ogg' && !isOgg) ||
          (asset.mimeType === 'audio/mpeg' && !isMp3)
        ) {
          throw new Error(`Asset MIME signature mismatch for ${asset.path}.`);
        }
      }
    }
    if (
      asset.mimeType === 'font/woff2' &&
      !(
        loaded.prefix.byteLength >= 4 &&
        loaded.prefix[0] === 0x77 &&
        loaded.prefix[1] === 0x4f &&
        loaded.prefix[2] === 0x46 &&
        loaded.prefix[3] === 0x32
      )
    ) {
      throw new Error(`WOFF2 signature mismatch for ${asset.path}.`);
    }
    if (
      asset.mimeType === 'image/png' &&
      !(
        loaded.prefix.byteLength >= 8 &&
        loaded.prefix[0] === 0x89 &&
        loaded.prefix[1] === 0x50 &&
        loaded.prefix[2] === 0x4e &&
        loaded.prefix[3] === 0x47 &&
        loaded.prefix[4] === 0x0d &&
        loaded.prefix[5] === 0x0a &&
        loaded.prefix[6] === 0x1a &&
        loaded.prefix[7] === 0x0a
      )
    ) {
      throw new Error(`PNG signature mismatch for ${asset.path}.`);
    }
    if (
      asset.mimeType === 'image/webp' &&
      !(
        loaded.prefix.byteLength >= 12 &&
        new TextDecoder().decode(loaded.prefix.slice(0, 4)) === 'RIFF' &&
        new TextDecoder().decode(loaded.prefix.slice(8, 12)) === 'WEBP'
      )
    ) {
      throw new Error(`WebP signature mismatch for ${asset.path}.`);
    }
    if (
      asset.mimeType === 'image/avif' &&
      !(
        loaded.prefix.byteLength >= 12 &&
        new TextDecoder().decode(loaded.prefix.slice(4, 8)) === 'ftyp'
      )
    ) {
      throw new Error(`AVIF signature mismatch for ${asset.path}.`);
    }
    if (isTextAsset) {
      if (loaded.contents === null) {
        throw new Error(`Text browser asset was not collected: ${asset.path}.`);
      }
      let text: string;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(loaded.contents);
      } catch (error) {
        throw new Error(`Browser text asset is not valid UTF-8: ${asset.path}.`, {
          cause: error,
        });
      }
      for (const privateValue of privateValues) {
        if (privateValue.length > 0 && text.includes(privateValue)) {
          throw new Error(`Source-derived private value leaked into browser asset ${asset.path}.`);
        }
      }
      verifyBrowserTextAsset(asset.path, asset.mimeType, text);
    }
  }
}

function isLocalRuntimeReference(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed !== '' &&
    !trimmed.startsWith('//') &&
    !/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(trimmed)
  );
}

function verifyHtmlAsset(assetPath: string, text: string): void {
  if (
    /<style\b/iu.test(text) ||
    /\sstyle\s*=/iu.test(text) ||
    /\son[a-z]+\s*=/iu.test(text) ||
    /javascript\s*:/iu.test(text) ||
    /<script\b(?![^>]*\bsrc\s*=)[^>]*>/iu.test(text) ||
    /<(?:base|embed|form|iframe|object)\b/iu.test(text) ||
    /<meta\b[^>]*\bhttp-equiv\s*=\s*["']?refresh\b/iu.test(text)
  ) {
    throw new Error(`Inline executable HTML is forbidden in ${assetPath}.`);
  }

  for (const match of text.matchAll(
    /<(?:audio|img|input|link|script|source|track|video)\b[^>]*\b(src|href|poster|srcset)\s*=\s*["']([^"']+)["']/giu,
  )) {
    const attribute = match[1]!.toLowerCase();
    const references =
      attribute === 'srcset'
        ? match[2]!
            .split(',')
            .map((candidate) => candidate.trim().split(/\s+/u)[0] ?? '')
        : [match[2]!];
    if (!references.every(isLocalRuntimeReference)) {
      throw new Error(`Remote browser resource is forbidden in ${assetPath}.`);
    }
  }

  if (assetPath === 'index.html') {
    const htmlTag = /<html\b([^>]*)>/iu.exec(text)?.[1] ?? '';
    const title = /<title>([^<]+)<\/title>/iu.exec(text)?.[1]?.trim() ?? '';
    if (
      !/^\s*<!doctype html>/iu.test(text) ||
      !/\blang\s*=\s*["']en["']/iu.test(htmlTag) ||
      !/\bdir\s*=\s*["']ltr["']/iu.test(htmlTag) ||
      title.length < 8 ||
      !/<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*\bcontent\s*=\s*["'][^"']{20,}["']/iu.test(
        text,
      ) ||
      !/\bid\s*=\s*["']root["']/iu.test(text) ||
      !/<noscript\b[^>]*>[\s\S]*(?:privacy|visitor)[\s\S]*<\/noscript>/iu.test(text)
    ) {
      throw new Error('index.html is missing its semantic document or privacy fallback.');
    }
  }
}

function verifyBrowserTextAsset(
  assetPath: string,
  mimeType: string,
  text: string,
): void {
  if (mimeType === 'text/html') {
    verifyHtmlAsset(assetPath, text);
    return;
  }
  if (mimeType === 'text/css') {
    if (/@import\b/iu.test(text)) {
      throw new Error(`CSS imports are forbidden in ${assetPath}.`);
    }
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/giu)) {
      if (!isLocalRuntimeReference(match[1]!)) {
        throw new Error(`Remote CSS resource is forbidden in ${assetPath}.`);
      }
    }
    return;
  }
  if (mimeType === 'text/javascript') {
    if (
      /\b(?:fetch|import)\s*\(\s*["'](?:\/\/|[A-Za-z][A-Za-z0-9+.-]*:)/u.test(
        text,
      ) ||
      /\bnew\s+(?:EventSource|Request|SharedWorker|WebSocket|Worker)\s*\(\s*["'](?:\/\/|[A-Za-z][A-Za-z0-9+.-]*:)/u.test(
        text,
      ) ||
      /\b(?:importScripts|sendBeacon)\s*\(\s*["'](?:\/\/|[A-Za-z][A-Za-z0-9+.-]*:)/u.test(
        text,
      ) ||
      /\.open\s*\(\s*["'][A-Z]+["']\s*,\s*["'](?:\/\/|[A-Za-z][A-Za-z0-9+.-]*:)/u.test(
        text,
      ) ||
      /\b(?:poster|src)\s*[:=]\s*["'](?:\/\/|[A-Za-z][A-Za-z0-9+.-]*:)/u.test(
        text,
      )
    ) {
      throw new Error(`Remote JavaScript runtime dependency is forbidden in ${assetPath}.`);
    }
    return;
  }
  if (mimeType === 'image/svg+xml') {
    if (
      /<script\b|<foreignObject\b|\son[a-z]+\s*=|javascript\s*:|@import\b/iu.test(
        text,
      )
    ) {
      throw new Error(`Unsafe SVG content is forbidden in ${assetPath}.`);
    }
    for (const match of text.matchAll(
      /\b(?:href|xlink:href|src)\s*=\s*["']([^"']+)["']/giu,
    )) {
      if (!isLocalRuntimeReference(match[1]!)) {
        throw new Error(`Remote SVG resource is forbidden in ${assetPath}.`);
      }
    }
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/giu)) {
      if (!isLocalRuntimeReference(match[1]!)) {
        throw new Error(`Remote SVG style resource is forbidden in ${assetPath}.`);
      }
    }
    return;
  }
  if (mimeType === 'application/manifest+json') {
    let manifest: unknown;
    try {
      manifest = JSON.parse(text) as unknown;
    } catch (error) {
      throw new Error(`Malformed web manifest ${assetPath}.`, { cause: error });
    }
    inspectPublicValue(
      manifest,
      assetPath,
      false,
      new Set<string>(),
      new Set<object>(),
    );
  }
}

async function loadSourcePrivateValues(
  projectRoot: string,
  profile: 'fixture' | 'production',
): Promise<ReadonlySet<string>> {
  if (profile === 'fixture') {
    const { makeFixtureCorpus } = await import('../tests/fixtures/content/corpus');
    const fixture = makeFixtureCorpus();
    return derivePrivateSourceValues(fixture.items, fixture.registries);
  }
  const loaded = await loadContentPrivate({ projectRoot, profile: 'production' });
  return loaded.privateValues;
}

function assertAudioManifestJoin(
  corpus: {
    readonly items: readonly {
      readonly audio: null | {
        readonly assetPath: string;
        readonly mimeType: string;
      };
    }[];
  },
  assets: readonly {
    readonly path: string;
    readonly mimeType: string;
  }[],
): void {
  const audioReferences = new Map<string, string>();
  for (const item of corpus.items) {
    if (item.audio !== null) {
      const previousMime = audioReferences.get(item.audio.assetPath);
      if (previousMime !== undefined && previousMime !== item.audio.mimeType) {
        throw new Error(
          `Corpus audio path ${item.audio.assetPath} has conflicting MIME types.`,
        );
      }
      audioReferences.set(item.audio.assetPath, item.audio.mimeType);
    }
  }

  for (const [audioPath, mimeType] of audioReferences) {
    const matches = assets.filter((asset) => asset.path === audioPath);
    if (matches.length !== 1 || matches[0]?.mimeType !== mimeType) {
      throw new Error(
        `Corpus audio ${audioPath} must join exactly one matching manifest entry.`,
      );
    }
  }
  for (const asset of assets) {
    if (asset.mimeType.startsWith('audio/') && !audioReferences.has(asset.path)) {
      throw new Error(`Orphan manifest audio entry ${asset.path}.`);
    }
  }
}

export async function verifyDist(
  options: VerifyDistOptions,
): Promise<ReleaseDescriptor> {
  const unresolvedDistRoot = path.resolve(options.distDir);
  const rootStat = await lstat(unresolvedDistRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error('Distribution root must be a regular, non-symlink directory.');
  }
  const distRoot = await realpath(unresolvedDistRoot);
  if (distRoot !== unresolvedDistRoot) {
    throw new Error('Distribution root cannot be reached through a symlink.');
  }
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

  const privateValues = await loadSourcePrivateValues(
    options.projectRoot,
    release.buildProfile,
  );
  inspectPublicValue(
    rawRelease,
    'release.json',
    fixtureForbidden,
    privateValues,
    new Set<object>(),
  );
  inspectPublicValue(
    rawCorpus,
    release.contentPath,
    fixtureForbidden,
    privateValues,
    new Set<object>(),
  );
  inspectPublicValue(
    rawAssetManifest,
    release.assetManifestPath,
    fixtureForbidden,
    privateValues,
    new Set<object>(),
  );

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

  assertAudioManifestJoin(corpus, assetManifest.assets);
  if (
    assetManifest.assets.filter((asset) => asset.path === 'index.html').length !== 1 ||
    !assetManifest.assets.some(
      (asset) =>
        asset.mimeType === 'text/javascript' && asset.path.startsWith('assets/'),
    )
  ) {
    throw new Error('Distribution is missing its browser index or hashed application entry.');
  }
  await verifyAssetFiles(
    distRoot,
    assetManifest.assets,
    release.buildProfile,
    privateValues,
  );
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
  const release = await verifyDist({
    projectRoot,
    distDir: path.join(projectRoot, 'dist'),
  });
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
