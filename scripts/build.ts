import { createHash, randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build as viteBuild } from 'vite';

import type { BuildProfile, ReleaseDescriptor } from '../src/contracts/release';
import { MAX_RELEASE_ASSET_BYTES } from '../src/contracts/release';
import { canonicalSha256 } from '../src/lib/content/canonical';
import {
  compileCorpus,
  type CompiledCorpus,
} from '../src/lib/content/compileCorpus';
import { registryBundleSchema } from '../src/lib/content/registrySchemas';
import {
  browserAssetMimeType,
  createReleaseArtifacts,
  type ReleaseAssetSource,
  type ReleaseArtifacts,
} from '../src/lib/content/release';
import { loadContentPrivate } from './content/loadContent';
import { readBoundedAssetFile } from './content/readAssetFile';
import { verifyDist } from './verify-dist';

const FIXTURE_RELEASE_ID = 'test-only-fixture-release';
/**
 * Hashed woff2 faces preloaded from the emitted index.html so first paint does
 * not wait for CSS parsing before critical font discovery. Only faces used by
 * the initial screens are listed; Noto Nastaliq Urdu stays lazy by design.
 */
const PRELOADED_FONT_FILE_STEMS = [
  'inter-latin-400-normal',
  'cormorant-garamond-latin-500-normal',
  'vazirmatn-arabic-400-normal',
] as const;
const FIXTURE_BUILT_AT = '2026-07-13T00:00:00.000Z';
const RELEASE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const BASELINE_MIN_HAFEZ = 24;
const BASELINE_MIN_RUMI = 16;
const MAX_BROWSER_DISTRIBUTION_BYTES = 150_000_000;

type BuildEnvironment = Readonly<Record<string, string | undefined>>;

function viteConfigPath(): string {
  try {
    return fileURLToPath(new URL('../vite.config.ts', import.meta.url));
  } catch {
    // Vitest serves transformed modules from a non-file URL. Its working
    // directory is the package root and contains the same reviewed config.
    return path.resolve(process.cwd(), 'vite.config.ts');
  }
}

function repositoryFilePath(relativePath: string): string {
  return path.resolve(path.dirname(viteConfigPath()), relativePath);
}

async function readReviewedRepositoryFile(
  relativePath: string,
): Promise<Uint8Array> {
  const filename = repositoryFilePath(relativePath);
  const stat = await lstat(filename);
  if (
    stat.isSymbolicLink() ||
    !stat.isFile() ||
    (await realpath(filename)) !== filename ||
    stat.size <= 0 ||
    stat.size > MAX_RELEASE_ASSET_BYTES
  ) {
    throw new Error(`Reviewed repository asset is invalid: ${relativePath}.`);
  }
  return new Uint8Array(await readFile(filename));
}

export interface FixtureBuildOptions {
  readonly projectRoot: string;
  readonly distDir: string;
}

export interface FixtureAssetFile {
  readonly path: string;
  readonly contents: Uint8Array;
}

export interface LoadReleaseAudioAssetsOptions {
  readonly profile: BuildProfile;
  readonly projectRoot: string;
  readonly corpus: CompiledCorpus;
  readonly registries: unknown;
  readonly fixtureFiles?: readonly FixtureAssetFile[];
}

export interface ProductionBuildOptions {
  readonly projectRoot: string;
  readonly distDir: string;
  readonly environment: BuildEnvironment;
}

export interface ProductionBuildConfig {
  readonly publicOrigin: string;
  readonly releaseId: string;
  readonly minimumHafezCount: number;
  readonly minimumRumiCount: number;
  readonly brandingMode: 'society_only' | 'university_approved';
  readonly universityApprovalId: string | null;
  readonly builtAt: string;
  readonly buildDate: string;
}

function requiredValue(environment: BuildEnvironment, name: string): string {
  const value = environment[name]?.trim();
  if (value === undefined || value === '') {
    throw new Error(`Production build requires explicit ${name}.`);
  }
  return value;
}

function parseMinimum(value: string, name: string, floor: number): number {
  if (!/^\d+$/u.test(value)) {
    throw new Error(`${name} must be a base-10 integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < floor) {
    throw new Error(
      `${name} cannot weaken the approved minimum of ${String(floor)}.`,
    );
  }
  return parsed;
}

function parseSourceDateEpoch(value: string): string {
  if (!/^(?:0|[1-9]\d*)$/u.test(value)) {
    throw new Error(
      'SOURCE_DATE_EPOCH must be a non-negative integer in seconds.',
    );
  }
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds)) {
    throw new Error(
      'SOURCE_DATE_EPOCH is outside the supported integer range.',
    );
  }
  const builtAt = new Date(seconds * 1_000);
  if (Number.isNaN(builtAt.valueOf())) {
    throw new Error(
      'SOURCE_DATE_EPOCH does not identify a valid UTC timestamp.',
    );
  }
  return builtAt.toISOString();
}

export function parseProductionBuildConfig(
  environment: BuildEnvironment,
): ProductionBuildConfig {
  const publicOrigin = requiredValue(environment, 'DIVAN_PUBLIC_ORIGIN');
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(publicOrigin);
  } catch (error) {
    throw new Error(
      'DIVAN_PUBLIC_ORIGIN must be an approved absolute HTTPS origin.',
      {
        cause: error,
      },
    );
  }
  if (
    parsedOrigin.protocol !== 'https:' ||
    parsedOrigin.username !== '' ||
    parsedOrigin.password !== '' ||
    parsedOrigin.pathname !== '/' ||
    parsedOrigin.search !== '' ||
    parsedOrigin.hash !== '' ||
    parsedOrigin.origin !== publicOrigin
  ) {
    throw new Error(
      'DIVAN_PUBLIC_ORIGIN must be an approved absolute HTTPS origin.',
    );
  }

  const releaseId = requiredValue(environment, 'DIVAN_RELEASE_ID');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(releaseId)) {
    throw new Error('DIVAN_RELEASE_ID must use lowercase kebab-case.');
  }

  const minimumHafezCount = parseMinimum(
    requiredValue(environment, 'DIVAN_MIN_HAFEZ_COUNT'),
    'DIVAN_MIN_HAFEZ_COUNT',
    BASELINE_MIN_HAFEZ,
  );
  const minimumRumiCount = parseMinimum(
    requiredValue(environment, 'DIVAN_MIN_RUMI_COUNT'),
    'DIVAN_MIN_RUMI_COUNT',
    BASELINE_MIN_RUMI,
  );
  const brandingValue = requiredValue(environment, 'DIVAN_BRANDING_MODE');
  if (
    brandingValue !== 'society_only' &&
    brandingValue !== 'university_approved'
  ) {
    throw new Error(
      'DIVAN_BRANDING_MODE must be society_only or university_approved.',
    );
  }

  const approvalValue =
    environment['DIVAN_UNIVERSITY_APPROVAL_ID']?.trim() ?? '';
  if (brandingValue === 'university_approved' && approvalValue === '') {
    throw new Error(
      'University-approved branding requires a recorded university approval identifier.',
    );
  }
  if (
    approvalValue !== '' &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(approvalValue)
  ) {
    throw new Error(
      'University approval identifier must use lowercase kebab-case.',
    );
  }

  const builtAt = parseSourceDateEpoch(
    requiredValue(environment, 'SOURCE_DATE_EPOCH'),
  );
  return {
    publicOrigin,
    releaseId,
    minimumHafezCount,
    minimumRumiCount,
    brandingMode: brandingValue,
    universityApprovalId: approvalValue === '' ? null : approvalValue,
    builtAt,
    buildDate: builtAt.slice(0, 10),
  };
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

function assertContained(root: string, candidate: string, label: string): void {
  const relative = path.relative(root, candidate);
  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} escapes its approved root.`);
  }
}

async function canonicalProjectRoot(projectRoot: string): Promise<string> {
  const resolved = path.resolve(projectRoot);
  const stat = await lstat(resolved);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(
      'Explicit projectRoot must be a regular, non-symlink directory.',
    );
  }
  const canonical = await realpath(resolved);
  if (canonical !== resolved) {
    throw new Error(
      'Explicit projectRoot cannot traverse a symlinked directory.',
    );
  }
  return canonical;
}

export async function resolveSafeOutputDirectory(
  projectRoot: string,
  distDir: string,
): Promise<string> {
  const canonicalRoot = await canonicalProjectRoot(projectRoot);
  const resolvedDist = path.resolve(distDir);
  const expectedDist = path.join(canonicalRoot, 'dist');
  const forbidden = new Set([
    path.parse(resolvedDist).root,
    path.resolve(process.cwd()),
    path.resolve(homedir()),
    canonicalRoot,
  ]);
  if (forbidden.has(resolvedDist) || resolvedDist !== expectedDist) {
    throw new Error(
      'Refusing to replace an unsafe distribution directory; distDir must equal explicit projectRoot/dist.',
    );
  }

  try {
    const stat = await lstat(resolvedDist);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(
        'Refusing to replace a symlinked or irregular distribution root.',
      );
    }
    if ((await realpath(resolvedDist)) !== expectedDist) {
      throw new Error(
        'Refusing to replace a distribution root reached through a symlink.',
      );
    }
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }

  return expectedDist;
}

export interface FileIdentity {
  readonly dev: number;
  readonly ino: number;
}

export interface DistributionActivationOperations {
  readonly inspect: typeof lstat;
  readonly move: typeof rename;
  readonly remove: (target: string) => Promise<void>;
  readonly warn: (message: string) => void;
}

function fileIdentity(stat: {
  readonly dev: number;
  readonly ino: number;
}): FileIdentity {
  return { dev: stat.dev, ino: stat.ino };
}

function sameIdentity(
  left: FileIdentity,
  right: { readonly dev: number; readonly ino: number },
): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

async function withBuildLock<T>(
  projectRoot: string,
  operation: (canonicalRoot: string) => Promise<T>,
): Promise<T> {
  const canonicalRoot = await canonicalProjectRoot(projectRoot);
  const lockPath = path.join(canonicalRoot, '.divan-build.lock');
  let lockHandle;
  try {
    lockHandle = await open(lockPath, 'wx', 0o600);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'EEXIST'
    ) {
      throw new Error(
        'Another DIVAN release build already holds the project lock.',
        {
          cause: error,
        },
      );
    }
    throw error;
  }

  const identity = fileIdentity(await lockHandle.stat());
  const outcome = await operation(canonicalRoot).then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  let cleanupError: unknown = null;
  try {
    await lockHandle.close();
    const current = await lstat(lockPath);
    if (!sameIdentity(identity, current) || !current.isFile()) {
      throw new Error('DIVAN build lock identity changed during the build.');
    }
    await unlink(lockPath);
  } catch (error) {
    if (!isNotFound(error)) {
      cleanupError = error;
    }
  }

  if (!outcome.ok) {
    if (cleanupError !== null) {
      throw new Error('Release build and lock cleanup both failed.', {
        cause: new AggregateError([outcome.error, cleanupError]),
      });
    }
    if (outcome.error instanceof Error) {
      throw outcome.error;
    }
    throw new Error('Release build failed with a non-Error value.', {
      cause: outcome.error,
    });
  }
  if (cleanupError !== null) {
    if (cleanupError instanceof Error) {
      throw cleanupError;
    }
    throw new Error('Build lock cleanup failed with a non-Error value.', {
      cause: cleanupError,
    });
  }
  return outcome.value;
}

async function collectBrowserAssets(
  stageRoot: string,
  directory = stageRoot,
): Promise<readonly ReleaseAssetSource[]> {
  const directoryStat = await lstat(directory);
  if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
    throw new Error(
      'Vite output directories must be regular non-symlink directories.',
    );
  }

  const assets: ReleaseAssetSource[] = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.toSorted((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const absolute = path.join(directory, entry.name);
    const relative = path
      .relative(stageRoot, absolute)
      .split(path.sep)
      .join('/');
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlinked Vite output is forbidden: ${relative}.`);
    }
    if (entry.isDirectory()) {
      assets.push(...(await collectBrowserAssets(stageRoot, absolute)));
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`Special Vite output is forbidden: ${relative}.`);
    }

    const stat = await lstat(absolute);
    if (
      stat.isSymbolicLink() ||
      !stat.isFile() ||
      stat.size <= 0 ||
      stat.size > MAX_RELEASE_ASSET_BYTES
    ) {
      throw new Error(`Invalid Vite output size or type: ${relative}.`);
    }
    const mimeType = browserAssetMimeType(relative);
    if (mimeType === null) {
      throw new Error(`Unexpected or unhashed Vite output: ${relative}.`);
    }
    const contents = new Uint8Array(await readFile(absolute));
    assets.push({
      path: relative,
      mimeType,
      sha256: createHash('sha256').update(contents).digest('hex'),
      bytes: contents.byteLength,
      requiredOffline: true,
      contents,
    });
  }
  return assets;
}

export async function buildServiceWorkerBytes(
  projectRoot: string,
  releaseId: string,
  contentSha256: string,
): Promise<Uint8Array> {
  if (!RELEASE_ID_PATTERN.test(releaseId)) {
    throw new Error('Service-worker release ID must use lowercase kebab-case.');
  }
  if (!/^[a-f0-9]{64}$/u.test(contentSha256)) {
    throw new Error(
      'Service-worker content SHA-256 must use 64 lowercase hex characters.',
    );
  }
  const canonicalRoot = await canonicalProjectRoot(projectRoot);
  const stageRoot = await mkdtemp(
    path.join(canonicalRoot, '.divan-worker-stage-'),
  );
  try {
    await viteBuild({
      root: canonicalRoot,
      configFile: false,
      publicDir: false,
      envDir: false,
      define: {
        __DIVAN_RELEASE_ID__: JSON.stringify(releaseId),
        __DIVAN_CONTENT_SHA256__: JSON.stringify(contentSha256),
      },
      logLevel: 'silent',
      build: {
        target: 'es2022',
        emptyOutDir: false,
        outDir: stageRoot,
        sourcemap: false,
        rollupOptions: {
          input: repositoryFilePath('src-sw/service-worker.ts'),
          output: {
            entryFileNames: 'service-worker.js',
            format: 'iife',
            name: 'DivanServiceWorker',
          },
        },
      },
    });
    const entries = await readdir(stageRoot, { withFileTypes: true });
    if (
      entries.length !== 1 ||
      entries[0]?.name !== 'service-worker.js' ||
      !entries[0].isFile()
    ) {
      throw new Error(
        'Service-worker build must emit exactly one fixed script.',
      );
    }
    const workerPath = path.join(stageRoot, 'service-worker.js');
    const stat = await lstat(workerPath);
    if (
      stat.isSymbolicLink() ||
      !stat.isFile() ||
      stat.size <= 0 ||
      stat.size > MAX_RELEASE_ASSET_BYTES ||
      (await realpath(workerPath)) !== workerPath
    ) {
      throw new Error('Service-worker output is invalid.');
    }
    return new Uint8Array(await readFile(workerPath));
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
}

/**
 * Inject local font preload links for the approved critical faces into an
 * emitted index.html. Assets are matched against the hashed Vite output paths;
 * a face absent from the build (for example in minimal test projects) is
 * skipped rather than fabricated. All injected hrefs are root-relative local
 * paths, keeping the distribution free of remote resources.
 */
export function injectFontPreloadLinks(
  html: string,
  assetPaths: readonly string[],
): string {
  const links: string[] = [];
  for (const stem of PRELOADED_FONT_FILE_STEMS) {
    const pattern = new RegExp(`^assets/${stem}-[a-f0-9]{16}\\.woff2$`, 'u');
    const matches = assetPaths.filter((assetPath) => pattern.test(assetPath));
    if (matches.length > 1) {
      throw new Error(`Multiple hashed font assets match ${stem}.`);
    }
    const match = matches[0];
    if (match !== undefined) {
      links.push(
        `    <link rel="preload" as="font" type="font/woff2" crossorigin href="/${match}" />`,
      );
    }
  }
  if (links.length === 0) {
    return html;
  }
  const headClose = html.indexOf('</head>');
  if (headClose === -1) {
    throw new Error('Emitted index.html is missing its head element.');
  }
  return `${html.slice(0, headClose)}${links.join('\n')}\n  ${html.slice(headClose)}`;
}

async function injectStagedFontPreloads(stageRoot: string): Promise<void> {
  let emittedAssetNames: readonly string[] = [];
  try {
    emittedAssetNames = await readdir(path.join(stageRoot, 'assets'));
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }
  const indexPath = path.join(stageRoot, 'index.html');
  const html = await readFile(indexPath, 'utf8');
  const injected = injectFontPreloadLinks(
    html,
    emittedAssetNames.map((name) => `assets/${name}`),
  );
  if (injected !== html) {
    await writeFile(indexPath, injected, 'utf8');
  }
}

async function buildBrowserAssets(
  projectRoot: string,
  releaseId: string,
  contentSha256: string,
): Promise<readonly ReleaseAssetSource[]> {
  const configPath = viteConfigPath();
  const configStat = await lstat(configPath);
  if (
    configStat.isSymbolicLink() ||
    !configStat.isFile() ||
    (await realpath(configPath)) !== configPath
  ) {
    throw new Error('Vite configuration must be a regular non-symlink file.');
  }
  const stageRoot = await mkdtemp(path.join(projectRoot, '.divan-vite-stage-'));
  try {
    await viteBuild({
      root: projectRoot,
      configFile: configPath,
      publicDir: false,
      logLevel: 'silent',
      build: {
        emptyOutDir: false,
        outDir: stageRoot,
      },
    });
    await injectStagedFontPreloads(stageRoot);
    for (const filename of [
      'icon.svg',
      'manifest.webmanifest',
      'offline.html',
    ] as const) {
      await writeFile(
        path.join(stageRoot, filename),
        await readReviewedRepositoryFile(`public/${filename}`),
        { flag: 'wx' },
      );
    }
    await writeFile(
      path.join(stageRoot, 'service-worker.js'),
      await buildServiceWorkerBytes(projectRoot, releaseId, contentSha256),
      { flag: 'wx' },
    );
    const assets = await collectBrowserAssets(stageRoot);
    const totalBytes = assets.reduce((total, asset) => total + asset.bytes, 0);
    if (
      assets.filter((asset) => asset.path === 'index.html').length !== 1 ||
      !assets.some(
        (asset) =>
          asset.mimeType === 'text/javascript' &&
          asset.path.startsWith('assets/'),
      ) ||
      [
        'icon.svg',
        'manifest.webmanifest',
        'offline.html',
        'service-worker.js',
      ].some(
        (requiredPath) =>
          assets.filter((asset) => asset.path === requiredPath).length !== 1,
      ) ||
      totalBytes > MAX_BROWSER_DISTRIBUTION_BYTES
    ) {
      throw new Error(
        'Vite output is missing the semantic shell or exceeds its budget.',
      );
    }
    return assets;
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
}

function hasDeclaredAudioSignature(
  contents: Uint8Array,
  mimeType: 'audio/mpeg' | 'audio/ogg',
): boolean {
  if (mimeType === 'audio/ogg') {
    return (
      contents.byteLength >= 4 &&
      contents[0] === 0x4f &&
      contents[1] === 0x67 &&
      contents[2] === 0x67 &&
      contents[3] === 0x53
    );
  }
  return (
    (contents.byteLength >= 3 &&
      contents[0] === 0x49 &&
      contents[1] === 0x44 &&
      contents[2] === 0x33) ||
    (contents.byteLength >= 2 &&
      contents[0] === 0xff &&
      (contents[1]! & 0xe0) === 0xe0)
  );
}

async function readProductionAsset(
  publicRoot: string,
  relativePath: string,
  declaredBytes: number,
): Promise<{ readonly contents: Uint8Array; readonly sha256: string }> {
  const segments = relativePath.split('/');
  let current = publicRoot;
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    const directoryStat = await lstat(current);
    if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
      throw new Error(
        `Symlinked or irregular public asset directory is forbidden: ${relativePath}.`,
      );
    }
  }

  const filename = path.join(publicRoot, ...segments);
  assertContained(publicRoot, filename, 'Public asset path');
  const stat = await lstat(filename);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(
      `Symlinked or irregular public asset is forbidden: ${relativePath}.`,
    );
  }
  const canonical = await realpath(filename);
  assertContained(publicRoot, canonical, 'Public asset path');
  if (canonical !== filename) {
    throw new Error(`Public asset cannot traverse a symlink: ${relativePath}.`);
  }
  const result = await readBoundedAssetFile({
    filename: canonical,
    declaredBytes,
    label: relativePath,
    collectContents: true,
  });
  if (result.contents === null) {
    throw new Error(
      `Production asset contents were not collected: ${relativePath}.`,
    );
  }
  return { contents: result.contents, sha256: result.sha256 };
}

export async function loadReleaseAudioAssets(
  options: LoadReleaseAudioAssetsOptions,
): Promise<readonly ReleaseAssetSource[]> {
  const registries = registryBundleSchema.parse(options.registries);
  const audioByPath = new Map<
    string,
    { readonly mimeType: 'audio/mpeg' | 'audio/ogg' }
  >();
  for (const item of options.corpus.items) {
    if (item.audio !== null) {
      audioByPath.set(item.audio.assetPath, { mimeType: item.audio.mimeType });
    }
  }
  if (audioByPath.size === 0) {
    return [];
  }

  let publicRoot: string | null = null;
  if (options.profile === 'production') {
    const projectRoot = await canonicalProjectRoot(options.projectRoot);
    const candidateRoot = path.join(projectRoot, 'public-static');
    const rootStat = await lstat(candidateRoot);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      throw new Error(
        'Production public-static must be a regular, non-symlink directory.',
      );
    }
    publicRoot = await realpath(candidateRoot);
    if (publicRoot !== candidateRoot) {
      throw new Error('Production public-static cannot traverse a symlink.');
    }
  }

  const sources: ReleaseAssetSource[] = [];
  for (const [audioPath, audio] of audioByPath) {
    const registryMatches = registries.assets.assets.filter(
      (asset) => asset.path === audioPath,
    );
    const registryAsset = registryMatches[0];
    if (
      registryMatches.length !== 1 ||
      registryAsset === undefined ||
      registryAsset.kind !== 'audio' ||
      registryAsset.status !== 'active' ||
      registryAsset.mime_type !== audio.mimeType
    ) {
      throw new Error(
        `Compiled audio ${audioPath} must join exactly one active matching registry asset.`,
      );
    }

    let contents: Uint8Array;
    let digest: string;
    if (options.profile === 'fixture') {
      const fixtureMatches = (options.fixtureFiles ?? []).filter(
        (file) => file.path === audioPath,
      );
      if (fixtureMatches.length !== 1 || fixtureMatches[0] === undefined) {
        throw new Error(
          `Fixture audio ${audioPath} must have exactly one TEST ONLY asset file.`,
        );
      }
      contents = fixtureMatches[0].contents.slice();
      if (new TextDecoder().decode(contents) !== 'TEST ONLY - NOT AUDIO') {
        throw new Error(
          'Fixture audio bytes must be the explicit TEST ONLY - NOT AUDIO sentinel.',
        );
      }
      digest = createHash('sha256').update(contents).digest('hex');
    } else {
      if (publicRoot === null) {
        throw new Error('Production public-static root was not established.');
      }
      const loaded = await readProductionAsset(
        publicRoot,
        audioPath,
        registryAsset.bytes,
      );
      contents = loaded.contents;
      digest = loaded.sha256;
      if (!hasDeclaredAudioSignature(contents, registryAsset.mime_type)) {
        throw new Error(
          `Production audio MIME signature mismatch for ${audioPath}.`,
        );
      }
    }

    if (contents.byteLength !== registryAsset.bytes) {
      throw new Error(`Audio asset byte size mismatch for ${audioPath}.`);
    }
    if (digest !== registryAsset.sha256) {
      throw new Error(`Audio asset SHA-256 mismatch for ${audioPath}.`);
    }
    sources.push({
      path: audioPath,
      mimeType: registryAsset.mime_type,
      sha256: registryAsset.sha256,
      bytes: registryAsset.bytes,
      requiredOffline: false,
      contents,
    });
  }

  if (options.profile === 'fixture') {
    const referencedPaths = new Set(audioByPath.keys());
    const orphan = (options.fixtureFiles ?? []).find(
      (file) => !referencedPaths.has(file.path),
    );
    if (orphan !== undefined) {
      throw new Error(`Orphan TEST ONLY fixture asset file ${orphan.path}.`);
    }
  }
  return sources;
}

async function writeStagedReleaseArtifacts(
  stageRoot: string,
  artifacts: ReleaseArtifacts,
): Promise<void> {
  for (const [relativePath, contents] of artifacts.files) {
    const destination = path.resolve(stageRoot, relativePath);
    const relative = path.relative(stageRoot, destination);
    if (
      relative === '..' ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      throw new Error('Release artifact path escapes the staging directory.');
    }
    await mkdir(path.dirname(destination), { recursive: true });
    if (typeof contents === 'string') {
      await writeFile(destination, contents, { encoding: 'utf8', flag: 'wx' });
    } else {
      await writeFile(destination, contents, { flag: 'wx' });
    }
  }
}

const DEFAULT_ACTIVATION_OPERATIONS: DistributionActivationOperations = {
  inspect: lstat,
  move: rename,
  remove: async (target) => rm(target, { recursive: true, force: false }),
  warn: (message) => process.stderr.write(`${message}\n`),
};

export async function activateStagedDistribution(options: {
  readonly projectRoot: string;
  readonly outputRoot: string;
  readonly stageRoot: string;
  readonly previousIdentity: FileIdentity | null;
  readonly operations?: DistributionActivationOperations;
}): Promise<void> {
  const operations = options.operations ?? DEFAULT_ACTIVATION_OPERATIONS;
  let backupRoot: string | null = null;

  if (options.previousIdentity !== null) {
    const current = await operations.inspect(options.outputRoot);
    if (
      !sameIdentity(options.previousIdentity, current) ||
      !current.isDirectory()
    ) {
      throw new Error('Distribution identity changed before activation.');
    }
    backupRoot = path.join(
      options.projectRoot,
      `.divan-dist-backup-${randomUUID()}`,
    );
    await operations.move(options.outputRoot, backupRoot);
  } else {
    try {
      await operations.inspect(options.outputRoot);
      throw new Error('A distribution appeared before activation.');
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }

  try {
    await operations.move(options.stageRoot, options.outputRoot);
  } catch (activationError) {
    if (backupRoot !== null) {
      try {
        await operations.move(backupRoot, options.outputRoot);
        backupRoot = null;
      } catch (restoreError) {
        throw new Error(
          'The candidate activation failed and the previous-release restore also failed.',
          { cause: restoreError },
        );
      }
    }
    throw new Error(
      'Distribution activation failed; the previous release was restored.',
      {
        cause: activationError,
      },
    );
  }

  if (backupRoot !== null) {
    try {
      const backup = await operations.inspect(backupRoot);
      if (
        options.previousIdentity === null ||
        !sameIdentity(options.previousIdentity, backup) ||
        !backup.isDirectory()
      ) {
        throw new Error('Distribution backup identity changed before cleanup.');
      }
      await operations.remove(backupRoot);
    } catch {
      // The verified release is already active. Treat backup cleanup as
      // maintenance rather than falsely reporting a failed activation that
      // replaced the previous release.
      operations.warn(
        'Verified release activated; a previous dist backup requires manual cleanup.',
      );
    }
  }
}

async function replaceReleaseArtifacts(
  projectRoot: string,
  distDir: string,
  artifacts: ReleaseArtifacts,
): Promise<void> {
  const outputRoot = await resolveSafeOutputDirectory(projectRoot, distDir);
  let previousIdentity: FileIdentity | null = null;
  try {
    const previous = await lstat(outputRoot);
    if (previous.isSymbolicLink() || !previous.isDirectory()) {
      throw new Error('Existing distribution must be a regular directory.');
    }
    previousIdentity = fileIdentity(previous);
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }
  const stageRoot = await mkdtemp(path.join(projectRoot, '.divan-dist-stage-'));

  try {
    await writeStagedReleaseArtifacts(stageRoot, artifacts);
    await verifyDist({ projectRoot, distDir: stageRoot });
    await activateStagedDistribution({
      projectRoot,
      outputRoot,
      stageRoot,
      previousIdentity,
    });
  } catch (error) {
    throw new Error(
      'Unable to stage and activate a complete release distribution.',
      {
        cause: error,
      },
    );
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
}

export async function buildFixtureRelease(
  options: FixtureBuildOptions,
): Promise<ReleaseDescriptor> {
  return withBuildLock(options.projectRoot, async (projectRoot) => {
    // The dynamic import keeps production discovery independent from test-only inputs.
    const { makeFixtureCorpus } =
      await import('../tests/fixtures/content/corpus');
    const fixture = makeFixtureCorpus();
    const compiled = compileCorpus({
      profile: 'fixture',
      items: fixture.items,
      registries: fixture.registries,
      buildDate: FIXTURE_BUILT_AT.slice(0, 10),
    });
    if (
      compiled.hafezCount !== 24 ||
      compiled.rumiCount !== 16 ||
      compiled.totalCount !== 40
    ) {
      throw new Error(
        'Fixture build must contain exactly 24 Hafez and 16 Rumi items.',
      );
    }

    const [audioAssets, browserAssets] = await Promise.all([
      loadReleaseAudioAssets({
        profile: 'fixture',
        projectRoot,
        corpus: compiled,
        registries: fixture.registries,
        fixtureFiles: fixture.assetFiles,
      }),
      buildBrowserAssets(
        projectRoot,
        FIXTURE_RELEASE_ID,
        canonicalSha256({
          schemaVersion: 2,
          releaseId: FIXTURE_RELEASE_ID,
          items: compiled.items,
        }),
      ),
    ]);

    const artifacts = createReleaseArtifacts({
      profile: 'fixture',
      releaseId: FIXTURE_RELEASE_ID,
      builtAt: FIXTURE_BUILT_AT,
      corpus: compiled,
      assets: [...audioAssets, ...browserAssets],
    });
    await replaceReleaseArtifacts(projectRoot, options.distDir, artifacts);
    return artifacts.release;
  });
}

export async function buildProductionRelease(
  options: ProductionBuildOptions,
): Promise<ReleaseDescriptor> {
  // Discover the private source first so this repository reports the approved,
  // precise launch blocker without pretending missing environment is the cause.
  const loaded = await loadContentPrivate({
    projectRoot: options.projectRoot,
    profile: 'production',
  });
  const config = parseProductionBuildConfig(options.environment);
  return withBuildLock(options.projectRoot, async (projectRoot) => {
    const compiled = compileCorpus({
      profile: 'production',
      items: loaded.items,
      registries: loaded.registries,
      buildDate: config.buildDate,
    });
    if (
      compiled.hafezCount < config.minimumHafezCount ||
      compiled.rumiCount < config.minimumRumiCount
    ) {
      throw new Error(
        'Production corpus does not meet the configured poet minimums.',
      );
    }

    const [audioAssets, browserAssets] = await Promise.all([
      loadReleaseAudioAssets({
        profile: 'production',
        projectRoot,
        corpus: compiled,
        registries: loaded.registries,
      }),
      buildBrowserAssets(
        projectRoot,
        config.releaseId,
        canonicalSha256({
          schemaVersion: 2,
          releaseId: config.releaseId,
          items: compiled.items,
        }),
      ),
    ]);

    const artifacts = createReleaseArtifacts({
      profile: 'production',
      releaseId: config.releaseId,
      builtAt: config.builtAt,
      corpus: compiled,
      assets: [...audioAssets, ...browserAssets],
    });
    await replaceReleaseArtifacts(projectRoot, options.distDir, artifacts);
    return artifacts.release;
  });
}

function parseProfile(arguments_: readonly string[]): 'fixture' | 'production' {
  if (
    arguments_.length !== 2 ||
    arguments_[0] !== '--profile' ||
    (arguments_[1] !== 'fixture' && arguments_[1] !== 'production')
  ) {
    throw new Error('Usage: tsx scripts/build.ts --profile fixture|production');
  }
  return arguments_[1];
}

async function main(): Promise<void> {
  const profile = parseProfile(process.argv.slice(2));
  const projectRoot = path.resolve(
    fileURLToPath(new URL('..', import.meta.url)),
  );
  const distDir = path.join(projectRoot, 'dist');
  const release =
    profile === 'fixture'
      ? await buildFixtureRelease({ projectRoot, distDir })
      : await buildProductionRelease({
          projectRoot,
          distDir,
          environment: process.env,
        });
  process.stdout.write(
    `Built ${release.buildProfile} release ${release.releaseId} (${String(release.itemCount)} items).\n`,
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  path.resolve(invokedPath) === path.resolve(fileURLToPath(import.meta.url))
) {
  main().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Unknown build failure.';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
