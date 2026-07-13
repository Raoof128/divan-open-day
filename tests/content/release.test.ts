import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { compileCorpus } from '../../src/lib/content/compileCorpus';
import { registryBundleSchema } from '../../src/lib/content/registrySchemas';
import {
  assetManifestSchema,
  createReleaseArtifacts,
  type ReleaseAssetSource,
} from '../../src/lib/content/release';
import { makeFixtureCorpus } from '../fixtures/content/corpus';

const EXPECTED_MAX_RELEASE_ASSET_BYTES = 100_000_000;

function compileFixture() {
  const fixture = makeFixtureCorpus();
  return compileCorpus({
    profile: 'fixture',
    items: fixture.items,
    registries: fixture.registries,
    buildDate: '2026-07-13',
  });
}

function fixtureAudioSource(): ReleaseAssetSource {
  const fixture = makeFixtureCorpus();
  const asset = registryBundleSchema.parse(fixture.registries).assets.assets[0]!;
  const file = fixture.assetFiles[0]!;
  if (asset.kind !== 'audio') {
    throw new Error('TEST ONLY fixture asset must be audio.');
  }
  return {
    path: asset.path,
    mimeType: asset.mime_type,
    sha256: asset.sha256,
    bytes: asset.bytes,
    requiredOffline: false,
    contents: file.contents,
  };
}

function makeAssetSource(
  directory: 'images' | 'audio',
  extension: 'webp' | 'mp3',
  mimeType: 'image/webp' | 'audio/mpeg',
  contents: Uint8Array,
): ReleaseAssetSource {
  const sha256 = createHash('sha256').update(contents).digest('hex');
  return {
    path: `${directory}/asset-${sha256.slice(0, 8)}.${extension}`,
    mimeType,
    sha256,
    bytes: contents.byteLength,
    requiredOffline: false,
    contents,
  };
}

function createFixtureRelease(
  assets: readonly ReleaseAssetSource[] = [fixtureAudioSource()],
) {
  return createReleaseArtifacts({
    profile: 'fixture',
    releaseId: 'test-only-fixture-release',
    builtAt: '2026-07-13T00:00:00.000Z',
    corpus: compileFixture(),
    assets,
  });
}

describe('createReleaseArtifacts', () => {
  it('rejects a release whose compiled audio has no manifest asset and file', () => {
    expect(() => createFixtureRelease([])).toThrow(/audio|asset|manifest|missing/iu);
  });

  it('rejects oversized byte counts in the public asset manifest schema', () => {
    const sha256 = '1'.repeat(64);
    const result = assetManifestSchema.safeParse({
      releaseId: 'test-only-fixture-release',
      assets: [
        {
          path: `images/test-${sha256.slice(0, 8)}.webp`,
          mimeType: 'image/webp',
          sha256,
          bytes: EXPECTED_MAX_RELEASE_ASSET_BYTES + 1,
          requiredOffline: false,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

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
    const assets: ReleaseAssetSource[] = [
      makeAssetSource('images', 'webp', 'image/webp', Uint8Array.of(2, 2)),
      makeAssetSource('images', 'webp', 'image/webp', Uint8Array.of(1)),
      fixtureAudioSource(),
    ];

    const artifacts = createFixtureRelease(assets);

    expect(artifacts.assetManifest.assets.map((asset) => asset.path)).toEqual(
      assets.map((asset) => asset.path).toSorted(),
    );
  });

  it('allows only offline-required fixed and content-hashed browser assets', () => {
    const indexContents = new TextEncoder().encode('<!doctype html><title>DIVAN</title>');
    const scriptContents = new TextEncoder().encode('export {};');
    const index = {
      path: 'index.html',
      mimeType: 'text/html',
      sha256: createHash('sha256').update(indexContents).digest('hex'),
      bytes: indexContents.byteLength,
      requiredOffline: true,
      contents: indexContents,
    } satisfies ReleaseAssetSource;
    const script = {
      path: 'assets/index-0123456789abcdef.js',
      mimeType: 'text/javascript',
      sha256: createHash('sha256').update(scriptContents).digest('hex'),
      bytes: scriptContents.byteLength,
      requiredOffline: true,
      contents: scriptContents,
    } satisfies ReleaseAssetSource;

    expect(
      createFixtureRelease([fixtureAudioSource(), index, script]).assetManifest.assets,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ path: index.path }), expect.objectContaining({ path: script.path })]));
    expect(() =>
      createFixtureRelease([fixtureAudioSource(), { ...index, requiredOffline: false }]),
    ).toThrow(/offline|browser|asset/iu);
    expect(() =>
      createFixtureRelease([fixtureAudioSource(), { ...index, mimeType: 'text/css' }]),
    ).toThrow(/MIME|browser|asset/iu);
    expect(() =>
      createFixtureRelease([
        fixtureAudioSource(),
        { ...script, path: 'assets/index.js' },
      ]),
    ).toThrow(/content-addressed|MIME|asset/iu);
    expect(() =>
      createFixtureRelease([
        fixtureAudioSource(),
        { ...script, path: 'assets/.hidden-0123456789abcdef.js' },
      ]),
    ).toThrow(/path|asset/iu);
  });

  it('rejects remote, escaping, duplicate, or non-content-addressed assets', () => {
    const contents = Uint8Array.of(1);
    const sha256 = createHash('sha256').update(contents).digest('hex');
    const asset = {
      path: 'https://example.test/asset.webp',
      mimeType: 'image/webp',
      sha256,
      bytes: 1,
      requiredOffline: true,
      contents,
    } satisfies ReleaseAssetSource;
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

    const localAsset = {
      ...asset,
      path: `images/image-${sha256.slice(0, 8)}.webp`,
    };
    expect(() =>
      createFixtureRelease([fixtureAudioSource(), localAsset, localAsset]),
    ).toThrow(/duplicate|asset|path/iu);
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
