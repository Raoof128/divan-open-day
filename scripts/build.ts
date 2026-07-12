import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BuildProfile, ReleaseDescriptor } from '../src/contracts/release';
import {
  compileCorpus,
  type CompiledCorpus,
} from '../src/lib/content/compileCorpus';
import { registryBundleSchema } from '../src/lib/content/registrySchemas';
import {
  createReleaseArtifacts,
  type ReleaseAssetSource,
  type ReleaseArtifacts,
} from '../src/lib/content/release';
import { loadContentPrivate } from './content/loadContent';

const FIXTURE_RELEASE_ID = 'test-only-fixture-release';
const FIXTURE_BUILT_AT = '2026-07-13T00:00:00.000Z';
const BASELINE_MIN_HAFEZ = 24;
const BASELINE_MIN_RUMI = 16;

type BuildEnvironment = Readonly<Record<string, string | undefined>>;

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
    throw new Error(`${name} cannot weaken the approved minimum of ${String(floor)}.`);
  }
  return parsed;
}

function parseSourceDateEpoch(value: string): string {
  if (!/^(?:0|[1-9]\d*)$/u.test(value)) {
    throw new Error('SOURCE_DATE_EPOCH must be a non-negative integer in seconds.');
  }
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds)) {
    throw new Error('SOURCE_DATE_EPOCH is outside the supported integer range.');
  }
  const builtAt = new Date(seconds * 1_000);
  if (Number.isNaN(builtAt.valueOf())) {
    throw new Error('SOURCE_DATE_EPOCH does not identify a valid UTC timestamp.');
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
    throw new Error('DIVAN_PUBLIC_ORIGIN must be an approved absolute HTTPS origin.', {
      cause: error,
    });
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
    throw new Error('DIVAN_PUBLIC_ORIGIN must be an approved absolute HTTPS origin.');
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
  if (brandingValue !== 'society_only' && brandingValue !== 'university_approved') {
    throw new Error(
      'DIVAN_BRANDING_MODE must be society_only or university_approved.',
    );
  }

  const approvalValue = environment['DIVAN_UNIVERSITY_APPROVAL_ID']?.trim() ?? '';
  if (brandingValue === 'university_approved' && approvalValue === '') {
    throw new Error(
      'University-approved branding requires a recorded university approval identifier.',
    );
  }
  if (approvalValue !== '' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(approvalValue)) {
    throw new Error('University approval identifier must use lowercase kebab-case.');
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
    throw new Error('Explicit projectRoot must be a regular, non-symlink directory.');
  }
  const canonical = await realpath(resolved);
  if (canonical !== resolved) {
    throw new Error('Explicit projectRoot cannot traverse a symlinked directory.');
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
      throw new Error('Refusing to replace a symlinked or irregular distribution root.');
    }
    if ((await realpath(resolvedDist)) !== expectedDist) {
      throw new Error('Refusing to replace a distribution root reached through a symlink.');
    }
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }

  return expectedDist;
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
): Promise<Uint8Array> {
  const segments = relativePath.split('/');
  let current = publicRoot;
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    const directoryStat = await lstat(current);
    if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
      throw new Error(`Symlinked or irregular public asset directory is forbidden: ${relativePath}.`);
    }
  }

  const filename = path.join(publicRoot, ...segments);
  assertContained(publicRoot, filename, 'Public asset path');
  const stat = await lstat(filename);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`Symlinked or irregular public asset is forbidden: ${relativePath}.`);
  }
  const canonical = await realpath(filename);
  assertContained(publicRoot, canonical, 'Public asset path');
  if (canonical !== filename) {
    throw new Error(`Public asset cannot traverse a symlink: ${relativePath}.`);
  }
  return new Uint8Array(await readFile(canonical));
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
      throw new Error('Production public-static must be a regular, non-symlink directory.');
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
        throw new Error('Fixture audio bytes must be the explicit TEST ONLY - NOT AUDIO sentinel.');
      }
    } else {
      if (publicRoot === null) {
        throw new Error('Production public-static root was not established.');
      }
      contents = await readProductionAsset(publicRoot, audioPath);
      if (!hasDeclaredAudioSignature(contents, registryAsset.mime_type)) {
        throw new Error(`Production audio MIME signature mismatch for ${audioPath}.`);
      }
    }

    if (contents.byteLength !== registryAsset.bytes) {
      throw new Error(`Audio asset byte size mismatch for ${audioPath}.`);
    }
    const digest = createHash('sha256').update(contents).digest('hex');
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

async function writeReleaseArtifacts(
  projectRoot: string,
  distDir: string,
  artifacts: ReleaseArtifacts,
): Promise<void> {
  const outputRoot = await resolveSafeOutputDirectory(projectRoot, distDir);
  await rm(outputRoot, { recursive: true, force: true });

  try {
    for (const [relativePath, contents] of artifacts.files) {
      const destination = path.resolve(outputRoot, relativePath);
      const relative = path.relative(outputRoot, destination);
      if (
        relative === '..' ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
      ) {
        throw new Error('Release artifact path escapes the distribution directory.');
      }
      await mkdir(path.dirname(destination), { recursive: true });
      if (typeof contents === 'string') {
        await writeFile(destination, contents, { encoding: 'utf8', flag: 'wx' });
      } else {
        await writeFile(destination, contents, { flag: 'wx' });
      }
    }
  } catch (error) {
    await rm(outputRoot, { recursive: true, force: true });
    throw new Error('Unable to write a complete release distribution.', {
      cause: error,
    });
  }
}

export async function buildFixtureRelease(
  options: FixtureBuildOptions,
): Promise<ReleaseDescriptor> {
  // The dynamic import keeps production discovery independent from test-only inputs.
  const { makeFixtureCorpus } = await import('../tests/fixtures/content/corpus');
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
    throw new Error('Fixture build must contain exactly 24 Hafez and 16 Rumi items.');
  }

  const assets = await loadReleaseAudioAssets({
    profile: 'fixture',
    projectRoot: options.projectRoot,
    corpus: compiled,
    registries: fixture.registries,
    fixtureFiles: fixture.assetFiles,
  });

  const artifacts = createReleaseArtifacts({
    profile: 'fixture',
    releaseId: FIXTURE_RELEASE_ID,
    builtAt: FIXTURE_BUILT_AT,
    corpus: compiled,
    assets,
  });
  await writeReleaseArtifacts(options.projectRoot, options.distDir, artifacts);
  return artifacts.release;
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
    throw new Error('Production corpus does not meet the configured poet minimums.');
  }

  const assets = await loadReleaseAudioAssets({
    profile: 'production',
    projectRoot: options.projectRoot,
    corpus: compiled,
    registries: loaded.registries,
  });

  const artifacts = createReleaseArtifacts({
    profile: 'production',
    releaseId: config.releaseId,
    builtAt: config.builtAt,
    corpus: compiled,
    assets,
  });
  await writeReleaseArtifacts(options.projectRoot, options.distDir, artifacts);
  return artifacts.release;
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
  const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
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
    const message = error instanceof Error ? error.message : 'Unknown build failure.';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
