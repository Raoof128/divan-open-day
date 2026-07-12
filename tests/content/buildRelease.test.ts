import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  buildFixtureRelease,
  buildProductionRelease,
  parseProductionBuildConfig,
} from '../../scripts/build';
import { verifyDist } from '../../scripts/verify-dist';

const outputDirectories: string[] = [];

function temporaryDist(name: string): string {
  const directory = path.join(
    process.cwd(),
    '.tmp-tests',
    `${name}-${process.pid.toString()}-${outputDirectories.length.toString()}`,
  );
  outputDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    outputDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe('fixture release build', () => {
  it('writes and verifies an exact 24/16/40 non-production distribution', async () => {
    const distDir = temporaryDist('fixture');

    const release = await buildFixtureRelease({ distDir });
    const verified = await verifyDist({ distDir });

    expect(release).toMatchObject({
      buildProfile: 'fixture',
      productionEligible: false,
      itemCount: 40,
      hafezCount: 24,
      rumiCount: 16,
    });
    expect(verified).toEqual(release);
    expect((await readdir(distDir)).toSorted()).toEqual([
      'assets',
      'content',
      'release.json',
    ]);
  });

  it('is byte-for-byte deterministic across clean fixture builds', async () => {
    const firstDist = temporaryDist('fixture-first');
    const secondDist = temporaryDist('fixture-second');

    const first = await buildFixtureRelease({ distDir: firstDist });
    const second = await buildFixtureRelease({ distDir: secondDist });

    await expect(readFile(path.join(firstDist, 'release.json'), 'utf8')).resolves.toBe(
      await readFile(path.join(secondDist, 'release.json'), 'utf8'),
    );
    expect(first).toEqual(second);
  });
});

describe('production release build', () => {
  it('fails closed with the precise blocker when approved corpus is absent', async () => {
    await expect(
      buildProductionRelease({
        projectRoot: process.cwd(),
        distDir: temporaryDist('production'),
        environment: {
          DIVAN_PUBLIC_ORIGIN: 'https://divan.example.test',
          DIVAN_RELEASE_ID: '2026-open-day-r1',
          DIVAN_MIN_HAFEZ_COUNT: '24',
          DIVAN_MIN_RUMI_COUNT: '16',
          DIVAN_BRANDING_MODE: 'society_only',
          SOURCE_DATE_EPOCH: '1783900800',
        },
      }),
    ).rejects.toThrow(
      'Production build blocked: no approved production corpus exists in content-private.',
    );
  });

  it('requires secure explicit configuration and university approval evidence', () => {
    expect(() =>
      parseProductionBuildConfig({
        DIVAN_PUBLIC_ORIGIN: 'http://example.test',
        DIVAN_RELEASE_ID: '2026-open-day-r1',
        DIVAN_MIN_HAFEZ_COUNT: '24',
        DIVAN_MIN_RUMI_COUNT: '16',
        DIVAN_BRANDING_MODE: 'society_only',
        SOURCE_DATE_EPOCH: '1783900800',
      }),
    ).toThrow(/HTTPS|origin/iu);

    expect(() =>
      parseProductionBuildConfig({
        DIVAN_PUBLIC_ORIGIN: 'https://divan.example.test',
        DIVAN_RELEASE_ID: '2026-open-day-r1',
        DIVAN_MIN_HAFEZ_COUNT: '24',
        DIVAN_MIN_RUMI_COUNT: '16',
        DIVAN_BRANDING_MODE: 'university_approved',
        SOURCE_DATE_EPOCH: '1783900800',
      }),
    ).toThrow(/university.*approval/iu);
  });
});

describe('distribution verification', () => {
  it('detects corpus tampering', async () => {
    const distDir = temporaryDist('tampered');
    const release = await buildFixtureRelease({ distDir });
    const corpusPath = path.join(distDir, release.contentPath.slice(1));
    const corpus = JSON.parse(await readFile(corpusPath, 'utf8')) as {
      items: Array<{ reflection: string }>;
    };
    corpus.items[0]!.reflection = `${corpus.items[0]!.reflection} TAMPERED`;
    await writeFile(corpusPath, JSON.stringify(corpus), 'utf8');

    await expect(verifyDist({ distDir })).rejects.toThrow(/canonical|hash|tamper/iu);
  });

  it('detects private metadata leakage before publication', async () => {
    const distDir = temporaryDist('private-leak');
    const release = await buildFixtureRelease({ distDir });
    const corpusPath = path.join(distDir, release.contentPath.slice(1));
    const corpus = JSON.parse(await readFile(corpusPath, 'utf8')) as {
      items: Array<Record<string, unknown>>;
    };
    corpus.items[0]!['permissionRecordId'] = 'private-permission';
    await writeFile(corpusPath, JSON.stringify(corpus), 'utf8');

    await expect(verifyDist({ distDir })).rejects.toThrow(/private|permission/iu);
  });

  it('rejects private evidence files and unexpected output', async () => {
    const distDir = temporaryDist('unexpected');
    await buildFixtureRelease({ distDir });
    await writeFile(path.join(distDir, 'rights-register.yaml'), 'private: true\n');

    await expect(verifyDist({ distDir })).rejects.toThrow(
      /YAML|private|unexpected/iu,
    );
  });

  it('rejects fixture leakage if a distribution claims production eligibility', async () => {
    const distDir = temporaryDist('fixture-leak');
    await buildFixtureRelease({ distDir });
    const releasePath = path.join(distDir, 'release.json');
    const release = JSON.parse(await readFile(releasePath, 'utf8')) as {
      buildProfile: string;
      productionEligible: boolean;
    };
    release.buildProfile = 'production';
    release.productionEligible = true;
    const { canonicalStringify } = await import('../../src/lib/content/canonical');
    await writeFile(releasePath, canonicalStringify(release), 'utf8');

    await expect(verifyDist({ distDir })).rejects.toThrow(/fixture|TEST ONLY/iu);
  });

  it('rejects a non-UTC release timestamp even when it represents the same instant', async () => {
    const distDir = temporaryDist('non-utc');
    await buildFixtureRelease({ distDir });
    const releasePath = path.join(distDir, 'release.json');
    const release = JSON.parse(await readFile(releasePath, 'utf8')) as {
      builtAt: string;
    };
    release.builtAt = '2026-07-13T10:00:00.000+10:00';
    const { canonicalStringify } = await import('../../src/lib/content/canonical');
    await writeFile(releasePath, canonicalStringify(release), 'utf8');

    await expect(verifyDist({ distDir })).rejects.toThrow(/UTC|builtAt|timestamp/iu);
  });
});
