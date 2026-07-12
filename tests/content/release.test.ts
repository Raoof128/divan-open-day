import { describe, expect, it } from 'vitest';

import type { ReleaseAsset } from '../../src/contracts/release';
import { compileCorpus } from '../../src/lib/content/compileCorpus';
import { createReleaseArtifacts } from '../../src/lib/content/release';
import { makeFixtureCorpus } from '../fixtures/content/corpus';

function compileFixture() {
  const fixture = makeFixtureCorpus();
  return compileCorpus({
    profile: 'fixture',
    items: fixture.items,
    registries: fixture.registries,
    buildDate: '2026-07-13',
  });
}

function createFixtureRelease(assets: readonly ReleaseAsset[] = []) {
  return createReleaseArtifacts({
    profile: 'fixture',
    releaseId: 'test-only-fixture-release',
    builtAt: '2026-07-13T00:00:00.000Z',
    corpus: compileFixture(),
    assets,
  });
}

describe('createReleaseArtifacts', () => {
  it('produces deterministic canonical hashes and content-addressed paths', () => {
    const first = createFixtureRelease();
    const second = createFixtureRelease();

    expect(first).toEqual(second);
    expect(first.release).toMatchObject({
      schemaVersion: 2,
      buildProfile: 'fixture',
      productionEligible: false,
      itemCount: 40,
      hafezCount: 24,
      rumiCount: 16,
      builtAt: '2026-07-13T00:00:00.000Z',
    });
    expect(first.release.contentPath).toBe(
      `/content/${first.release.contentSha256}.json`,
    );
    expect(first.release.assetManifestPath).toBe(
      `/assets/${first.release.assetManifestSha256}.json`,
    );
    expect(first.files.get(first.release.contentPath.slice(1))).toBe(
      first.contentJson,
    );
    expect(first.files.get(first.release.assetManifestPath.slice(1))).toBe(
      first.assetManifestJson,
    );
  });

  it('sorts release assets deterministically', () => {
    const assets: ReleaseAsset[] = [
      {
        path: 'images/b-22222222.webp',
        sha256: '2'.repeat(64),
        bytes: 2,
        requiredOffline: false,
      },
      {
        path: 'images/a-11111111.webp',
        sha256: '1'.repeat(64),
        bytes: 1,
        requiredOffline: true,
      },
    ];

    const artifacts = createFixtureRelease(assets);

    expect(artifacts.assetManifest.assets.map((asset) => asset.path)).toEqual([
      'images/a-11111111.webp',
      'images/b-22222222.webp',
    ]);
  });

  it('rejects remote, escaping, duplicate, or non-content-addressed assets', () => {
    const asset = {
      path: 'https://example.test/asset.webp',
      sha256: '1'.repeat(64),
      bytes: 1,
      requiredOffline: true,
    } satisfies ReleaseAsset;
    expect(() => createFixtureRelease([asset])).toThrow(/asset|local|path/iu);

    expect(() =>
      createFixtureRelease([
        { ...asset, path: '../private.webp' },
      ]),
    ).toThrow(/asset|escape|path/iu);

    expect(() =>
      createFixtureRelease([
        { ...asset, path: 'images/image.webp' },
      ]),
    ).toThrow(/content-addressed|sha/iu);
  });

  it('rejects non-canonical timestamps', () => {
    expect(() =>
      createReleaseArtifacts({
        profile: 'fixture',
        releaseId: 'test-only-fixture-release',
        builtAt: '2026-07-13',
        corpus: compileFixture(),
        assets: [],
      }),
    ).toThrow(/builtAt|UTC|timestamp/iu);
  });
});
