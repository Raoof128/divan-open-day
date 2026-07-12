import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ReleaseDescriptor } from '../src/contracts/release';
import { compileCorpus } from '../src/lib/content/compileCorpus';
import {
  createReleaseArtifacts,
  type ReleaseArtifacts,
} from '../src/lib/content/release';
import { loadContentPrivate } from './content/loadContent';

const FIXTURE_RELEASE_ID = 'test-only-fixture-release';
const FIXTURE_BUILT_AT = '2026-07-13T00:00:00.000Z';
const BASELINE_MIN_HAFEZ = 24;
const BASELINE_MIN_RUMI = 16;

type BuildEnvironment = Readonly<Record<string, string | undefined>>;

export interface FixtureBuildOptions {
  readonly distDir: string;
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

function assertSafeOutputDirectory(distDir: string): string {
  const resolved = path.resolve(distDir);
  if (resolved === path.parse(resolved).root || resolved === process.cwd()) {
    throw new Error('Refusing to replace an unsafe distribution directory.');
  }
  return resolved;
}

async function writeReleaseArtifacts(
  distDir: string,
  artifacts: ReleaseArtifacts,
): Promise<void> {
  const outputRoot = assertSafeOutputDirectory(distDir);
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
      await writeFile(destination, contents, { encoding: 'utf8', flag: 'wx' });
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

  const artifacts = createReleaseArtifacts({
    profile: 'fixture',
    releaseId: FIXTURE_RELEASE_ID,
    builtAt: FIXTURE_BUILT_AT,
    corpus: compiled,
    // Application assets are intentionally empty at this content-only stage.
    assets: [],
  });
  await writeReleaseArtifacts(options.distDir, artifacts);
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

  const artifacts = createReleaseArtifacts({
    profile: 'production',
    releaseId: config.releaseId,
    builtAt: config.builtAt,
    corpus: compiled,
    assets: [],
  });
  await writeReleaseArtifacts(options.distDir, artifacts);
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
      ? await buildFixtureRelease({ distDir })
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
