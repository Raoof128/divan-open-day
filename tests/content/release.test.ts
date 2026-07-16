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
  const asset = registryBundleSchema.parse(fixture.registries).assets
    .assets[0]!;
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

function fixedBrowserSources(): ReleaseAssetSource[] {
  return [
    ['icon.svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg" />'],
    ['index.html', 'text/html', '<!doctype html><title>DIVAN</title>'],
    ['manifest.webmanifest', 'application/manifest+json', '{"name":"DIVAN"}'],
    ['offline.html', 'text/html', '<!doctype html><title>Offline</title>'],
    ['service-worker.js', 'text/javascript', '(function(){})();'],
    ['images/divan-poster-mobile.webp', 'image/webp', 'TEST ONLY POSTER M'],
    ['images/divan-poster-desktop.webp', 'image/webp', 'TEST ONLY POSTER D'],
    ['images/divan-alcove-mobile.webp', 'image/webp', 'TEST ONLY ALCOVE M'],
    ['images/divan-alcove-desktop.webp', 'image/webp', 'TEST ONLY ALCOVE D'],
    ['video/divan-cinematic-mobile.mp4', 'video/mp4', 'TEST ONLY CINE M'],
    ['video/divan-cinematic-desktop.mp4', 'video/mp4', 'TEST ONLY CINE D'],
  ].map(([assetPath, mimeType, text]) => {
    const contents = new TextEncoder().encode(text);
    return {
      path: assetPath!,
      mimeType: mimeType as ReleaseAssetSource['mimeType'],
      sha256: createHash('sha256').update(contents).digest('hex'),
      bytes: contents.byteLength,
      // Cinematic video is the one fixed browser asset class that must never
      // be precached; everything else in the fixed set is the offline shell.
      requiredOffline: mimeType !== 'video/mp4',
      contents,
    };
  });
}

function createFixtureRelease(
  assets: readonly ReleaseAssetSource[] = [
    fixtureAudioSource(),
    ...fixedBrowserSources(),
  ],
) {
  return createReleaseArtifacts({
    profile: 'fixture',
    releaseId: 'test-only-fixture-release',
    builtAt: '2026-07-13T00:00:00.000Z',
    corpus: compileFixture(),
    assets,
  });
}

describe('cinematic media contract', () => {
  it('rejects cinematic video marked as precached shell content', () => {
    const sources = fixedBrowserSources().map((source) =>
      source.mimeType === 'video/mp4'
        ? { ...source, requiredOffline: true }
        : source,
    );

    expect(() =>
      createFixtureRelease([fixtureAudioSource(), ...sources]),
    ).toThrow(/offline/iu);
  });

  it('rejects posters and backdrops excluded from the offline shell', () => {
    const sources = fixedBrowserSources().map((source) =>
      source.path === 'images/divan-poster-mobile.webp'
        ? { ...source, requiredOffline: false }
        : source,
    );

    expect(() =>
      createFixtureRelease([fixtureAudioSource(), ...sources]),
    ).toThrow(/offline/iu);
  });
});

describe('createReleaseArtifacts', () => {
  it('requires every fixed offline browser asset exactly once', () => {
    const result = assetManifestSchema.safeParse({
      releaseId: 'test-only-fixture-release',
      assets: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(
        /index\.html|manifest\.webmanifest|offline\.html|service-worker\.js/iu,
      );
    }
  });

  it('rejects a release whose compiled audio has no manifest asset and file', () => {
    expect(() => createFixtureRelease([])).toThrow(
      /audio|asset|manifest|missing/iu,
    );
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
      ...fixedBrowserSources(),
    ];

    const artifacts = createFixtureRelease(assets);

    expect(artifacts.assetManifest.assets.map((asset) => asset.path)).toEqual(
      assets.map((asset) => asset.path).toSorted(),
    );
  });

  it('allows only offline-required fixed and content-hashed browser assets', () => {
    const fixed = fixedBrowserSources();
    const index = fixed.find((asset) => asset.path === 'index.html')!;
    const scriptContents = new TextEncoder().encode('export {};');
    const script = {
      path: 'assets/index-0123456789abcdef.js',
      mimeType: 'text/javascript',
      sha256: createHash('sha256').update(scriptContents).digest('hex'),
      bytes: scriptContents.byteLength,
      requiredOffline: true,
      contents: scriptContents,
    } satisfies ReleaseAssetSource;

    expect(
      createFixtureRelease([fixtureAudioSource(), ...fixed, script])
        .assetManifest.assets,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: index.path }),
        expect.objectContaining({ path: script.path }),
      ]),
    );
    expect(() =>
      createFixtureRelease([
        fixtureAudioSource(),
        ...fixed.map((asset) =>
          asset.path === 'index.html'
            ? { ...asset, requiredOffline: false }
            : asset,
        ),
      ]),
    ).toThrow(/offline|browser|asset/iu);
    expect(() =>
      createFixtureRelease([
        fixtureAudioSource(),
        ...fixed.map((asset) =>
          asset.path === 'index.html'
            ? { ...asset, mimeType: 'text/css' as const }
            : asset,
        ),
      ]),
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
      createFixtureRelease([{ ...asset, path: '../private.webp' }]),
    ).toThrow(/asset|escape|path/iu);

    expect(() =>
      createFixtureRelease([{ ...asset, path: 'images/image.webp' }]),
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
        assets: [fixtureAudioSource(), ...fixedBrowserSources()],
      }),
    ).toThrow(/builtAt|UTC|timestamp/iu);
  });
});
