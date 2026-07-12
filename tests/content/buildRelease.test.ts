import { createHash } from 'node:crypto';
import {
  chmod,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  truncate,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  buildFixtureRelease,
  buildProductionRelease,
  loadReleaseAudioAssets,
  parseProductionBuildConfig,
  resolveSafeOutputDirectory,
} from '../../scripts/build';
import { verifyDist } from '../../scripts/verify-dist';
import { canonicalSha256, canonicalStringify } from '../../src/lib/content/canonical';
import { compileCorpus } from '../../src/lib/content/compileCorpus';
import {
  makeFixtureCorpus,
  refreshFixtureApproval,
  TEST_ONLY_AUDIO_BYTES,
} from '../fixtures/content/corpus';

const outputDirectories: string[] = [];
const EXPECTED_MAX_RELEASE_ASSET_BYTES = 100_000_000;

async function temporaryProject(name: string): Promise<{
  readonly projectRoot: string;
  readonly distDir: string;
}> {
  const projectRoot = path.join(
    process.cwd(),
    '.tmp-tests',
    `${name}-${process.pid.toString()}-${outputDirectories.length.toString()}`,
  );
  outputDirectories.push(projectRoot);
  await mkdir(projectRoot, { recursive: true });
  return { projectRoot, distDir: path.join(projectRoot, 'dist') };
}

async function rewriteCorpus(
  distDir: string,
  mutate: (item: Record<string, unknown>) => void,
): Promise<void> {
  const releasePath = path.join(distDir, 'release.json');
  const release = JSON.parse(await readFile(releasePath, 'utf8')) as {
    contentPath: string;
    contentSha256: string;
  };
  const oldCorpusPath = path.join(distDir, release.contentPath.slice(1));
  const corpus = JSON.parse(await readFile(oldCorpusPath, 'utf8')) as {
    items: Array<Record<string, unknown>>;
  };
  const item = corpus.items[0];
  if (item === undefined) {
    throw new Error('TEST ONLY release must contain its first item.');
  }
  mutate(item);
  const payload = { ...item };
  delete payload['contentHash'];
  item['contentHash'] = canonicalSha256(payload);

  const contentSha256 = canonicalSha256(corpus);
  const contentPath = `/content/${contentSha256}.json`;
  await rm(oldCorpusPath);
  await writeFile(
    path.join(distDir, contentPath.slice(1)),
    canonicalStringify(corpus),
    'utf8',
  );
  release.contentPath = contentPath;
  release.contentSha256 = contentSha256;
  await writeFile(releasePath, canonicalStringify(release), 'utf8');
}

async function rewriteAssetManifest(
  distDir: string,
  mutate: (manifest: { assets: Array<Record<string, unknown>> }) => void,
): Promise<void> {
  const releasePath = path.join(distDir, 'release.json');
  const release = JSON.parse(await readFile(releasePath, 'utf8')) as {
    assetManifestPath: string;
    assetManifestSha256: string;
  };
  const oldManifestPath = path.join(distDir, release.assetManifestPath.slice(1));
  const manifest = JSON.parse(await readFile(oldManifestPath, 'utf8')) as {
    assets: Array<Record<string, unknown>>;
  };
  mutate(manifest);
  const assetManifestSha256 = canonicalSha256(manifest);
  const assetManifestPath = `/assets/${assetManifestSha256}.json`;
  await rm(oldManifestPath);
  await writeFile(
    path.join(distDir, assetManifestPath.slice(1)),
    canonicalStringify(manifest),
    'utf8',
  );
  release.assetManifestPath = assetManifestPath;
  release.assetManifestSha256 = assetManifestSha256;
  await writeFile(releasePath, canonicalStringify(release), 'utf8');
}

async function makeProductionAudioCase(
  name: string,
  expectedBytes: Uint8Array,
) {
  const { projectRoot } = await temporaryProject(name);
  const fixture = makeFixtureCorpus();
  const item = fixture.items[0]!;
  const asset = fixture.registries.assets.assets[0]!;
  const sha256 = createHash('sha256').update(expectedBytes).digest('hex');
  const assetPath = `audio/test-audio-${sha256.slice(0, 8)}.mp3`;
  if (!item.audio.enabled || asset.kind !== 'audio') {
    throw new Error('TEST ONLY fixture must expose one enabled audio record.');
  }
  item.audio.asset_path = assetPath;
  asset.path = assetPath;
  asset.sha256 = sha256;
  asset.bytes = expectedBytes.byteLength;
  refreshFixtureApproval(fixture, item.id);
  const corpus = compileCorpus({
    profile: 'fixture',
    items: fixture.items,
    registries: fixture.registries,
    buildDate: '2026-07-13',
  });
  return {
    projectRoot,
    corpus,
    registries: fixture.registries,
    assetPath,
    expectedBytes,
  };
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
    const { projectRoot, distDir } = await temporaryProject('fixture');

    const release = await buildFixtureRelease({ projectRoot, distDir });
    const verified = await verifyDist({ projectRoot, distDir });

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
      'audio',
      'content',
      'release.json',
    ]);
  });

  it('is byte-for-byte deterministic across clean fixture builds', async () => {
    const firstProject = await temporaryProject('fixture-first');
    const secondProject = await temporaryProject('fixture-second');

    const first = await buildFixtureRelease(firstProject);
    const second = await buildFixtureRelease(secondProject);

    await expect(
      readFile(path.join(firstProject.distDir, 'release.json'), 'utf8'),
    ).resolves.toBe(
      await readFile(path.join(secondProject.distDir, 'release.json'), 'utf8'),
    );
    expect(first).toEqual(second);
  });

  it('emits one verified manifest entry and file for every compiled audio path', async () => {
    const { projectRoot, distDir } = await temporaryProject('fixture-audio');
    const release = await buildFixtureRelease({ projectRoot, distDir });
    const corpus = JSON.parse(
      await readFile(path.join(distDir, release.contentPath.slice(1)), 'utf8'),
    ) as { items: Array<{ audio: null | { assetPath: string; mimeType: string } }> };
    const manifest = JSON.parse(
      await readFile(path.join(distDir, release.assetManifestPath.slice(1)), 'utf8'),
    ) as {
      assets: Array<{
        path: string;
        mimeType: string;
        bytes: number;
        sha256: string;
      }>;
    };
    const audio = corpus.items.flatMap((item) => (item.audio === null ? [] : [item.audio]));

    expect(audio).toHaveLength(1);
    expect(manifest.assets).toHaveLength(1);
    expect(manifest.assets[0]).toMatchObject({
      path: audio[0]!.assetPath,
      mimeType: audio[0]!.mimeType,
      bytes: TEST_ONLY_AUDIO_BYTES.byteLength,
      sha256: createHash('sha256').update(TEST_ONLY_AUDIO_BYTES).digest('hex'),
    });
    await expect(
      readFile(path.join(distDir, audio[0]!.assetPath)),
    ).resolves.toEqual(Buffer.from(TEST_ONLY_AUDIO_BYTES));
  });

  it('refuses an output outside explicit projectRoot/dist without deleting it', async () => {
    const { projectRoot } = await temporaryProject('unsafe-output');
    const outside = path.join(projectRoot, 'outside');
    const sentinel = path.join(outside, 'keep.txt');
    await mkdir(outside);
    await writeFile(sentinel, 'keep', 'utf8');

    await expect(
      buildFixtureRelease({ projectRoot, distDir: outside }),
    ).rejects.toThrow(/unsafe|projectRoot|distribution|dist/iu);
    await expect(readFile(sentinel, 'utf8')).resolves.toBe('keep');
  });

  it('rejects root, cwd, home, project root, outside, and nested output paths', async () => {
    const { projectRoot, distDir } = await temporaryProject('unsafe-matrix');
    const outside = path.join(projectRoot, 'outside');
    const nested = path.join(distDir, 'nested');
    await mkdir(outside);
    await mkdir(nested, { recursive: true });

    for (const unsafePath of [
      path.parse(projectRoot).root,
      process.cwd(),
      homedir(),
      projectRoot,
      outside,
      nested,
    ]) {
      await expect(
        resolveSafeOutputDirectory(projectRoot, unsafePath),
      ).rejects.toThrow(/unsafe|projectRoot|distribution|dist/iu);
    }
  });

  it('refuses a symlinked output root before replacement', async () => {
    const { projectRoot, distDir } = await temporaryProject('symlink-output');
    const target = path.join(projectRoot, 'target');
    const sentinel = path.join(target, 'keep.txt');
    await mkdir(target);
    await writeFile(sentinel, 'keep', 'utf8');
    await symlink(target, distDir);

    await expect(
      buildFixtureRelease({ projectRoot, distDir }),
    ).rejects.toThrow(/symlink|unsafe|distribution/iu);
    await expect(readFile(sentinel, 'utf8')).resolves.toBe('keep');
  });
});

describe('production audio asset loading', () => {
  const validMp3Bytes = Uint8Array.of(0x49, 0x44, 0x33, 0x04, 0x00, 0x00);

  it('reads a referenced file only from public-static and verifies its metadata', async () => {
    const input = await makeProductionAudioCase('production-audio', validMp3Bytes);
    const filename = path.join(input.projectRoot, 'public-static', input.assetPath);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, input.expectedBytes);

    const assets = await loadReleaseAudioAssets({
      profile: 'production',
      projectRoot: input.projectRoot,
      corpus: input.corpus,
      registries: input.registries,
    });

    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      path: input.assetPath,
      mimeType: 'audio/mpeg',
      bytes: input.expectedBytes.byteLength,
    });
    expect(assets[0]!.contents).toEqual(input.expectedBytes);
  });

  it('rejects a missing production audio file', async () => {
    const input = await makeProductionAudioCase('missing-audio', validMp3Bytes);
    await mkdir(path.join(input.projectRoot, 'public-static', 'audio'), {
      recursive: true,
    });

    await expect(
      loadReleaseAudioAssets({
        profile: 'production',
        projectRoot: input.projectRoot,
        corpus: input.corpus,
        registries: input.registries,
      }),
    ).rejects.toThrow(/missing|ENOENT|audio|asset/iu);
  });

  it('rejects a symlinked production audio file', async () => {
    const input = await makeProductionAudioCase('symlink-audio', validMp3Bytes);
    const filename = path.join(input.projectRoot, 'public-static', input.assetPath);
    const outside = path.join(input.projectRoot, 'outside.mp3');
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(outside, input.expectedBytes);
    await symlink(outside, filename);

    await expect(
      loadReleaseAudioAssets({
        profile: 'production',
        projectRoot: input.projectRoot,
        corpus: input.corpus,
        registries: input.registries,
      }),
    ).rejects.toThrow(/symlink/iu);
  });

  it('rejects production audio whose byte count differs from its registry', async () => {
    const input = await makeProductionAudioCase('sized-audio', validMp3Bytes);
    const filename = path.join(input.projectRoot, 'public-static', input.assetPath);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, Uint8Array.from([...input.expectedBytes, 0x01]));
    await chmod(filename, 0o000);

    await expect(
      loadReleaseAudioAssets({
        profile: 'production',
        projectRoot: input.projectRoot,
        corpus: input.corpus,
        registries: input.registries,
      }),
    ).rejects.toThrow(`Asset size mismatch before read for ${input.assetPath}.`);
  });

  it('rejects an oversized production asset before attempting to read it', async () => {
    const input = await makeProductionAudioCase('oversized-audio', validMp3Bytes);
    const filename = path.join(input.projectRoot, 'public-static', input.assetPath);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, input.expectedBytes);
    await truncate(filename, EXPECTED_MAX_RELEASE_ASSET_BYTES + 1);
    await chmod(filename, 0o000);

    await expect(
      loadReleaseAudioAssets({
        profile: 'production',
        projectRoot: input.projectRoot,
        corpus: input.corpus,
        registries: input.registries,
      }),
    ).rejects.toThrow(
      `Asset exceeds maximum before read for ${input.assetPath}.`,
    );
  });

  it('rejects production audio whose SHA-256 differs from its registry', async () => {
    const input = await makeProductionAudioCase('hashed-audio', validMp3Bytes);
    const filename = path.join(input.projectRoot, 'public-static', input.assetPath);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, Uint8Array.of(0x49, 0x44, 0x33, 0x05, 0x00, 0x00));

    await expect(
      loadReleaseAudioAssets({
        profile: 'production',
        projectRoot: input.projectRoot,
        corpus: input.corpus,
        registries: input.registries,
      }),
    ).rejects.toThrow(/SHA|hash|digest/iu);
  });

  it('rejects production audio bytes that do not match the declared MIME type', async () => {
    const invalidMp3Bytes = new TextEncoder().encode('not an mp3');
    const input = await makeProductionAudioCase('mime-audio', invalidMp3Bytes);
    const filename = path.join(input.projectRoot, 'public-static', input.assetPath);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, invalidMp3Bytes);

    await expect(
      loadReleaseAudioAssets({
        profile: 'production',
        projectRoot: input.projectRoot,
        corpus: input.corpus,
        registries: input.registries,
      }),
    ).rejects.toThrow(/MIME|audio format/iu);
  });
});

describe('production release build', () => {
  it('fails closed with the precise blocker when approved corpus is absent', async () => {
    const { projectRoot, distDir } = await temporaryProject('production');
    await mkdir(path.join(projectRoot, 'content-private', 'hafez'), {
      recursive: true,
    });
    await mkdir(path.join(projectRoot, 'content-private', 'rumi'), {
      recursive: true,
    });
    await expect(
      buildProductionRelease({
        projectRoot,
        distDir,
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
  it('rejects a mismatched unreadable asset before verification reads it', async () => {
    const { projectRoot, distDir } = await temporaryProject('verify-sized-asset');
    const release = await buildFixtureRelease({ projectRoot, distDir });
    const manifest = JSON.parse(
      await readFile(path.join(distDir, release.assetManifestPath.slice(1)), 'utf8'),
    ) as { assets: Array<{ path: string }> };
    const assetPath = manifest.assets[0]!.path;
    const filename = path.join(distDir, assetPath);
    await writeFile(filename, Uint8Array.of(0x01), { flag: 'a' });
    await chmod(filename, 0o000);

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      `Asset size mismatch before read for ${assetPath}.`,
    );
  });

  it('rejects an oversized unreadable asset before verification reads it', async () => {
    const { projectRoot, distDir } = await temporaryProject('verify-oversized-asset');
    const release = await buildFixtureRelease({ projectRoot, distDir });
    const manifest = JSON.parse(
      await readFile(path.join(distDir, release.assetManifestPath.slice(1)), 'utf8'),
    ) as { assets: Array<{ path: string }> };
    const assetPath = manifest.assets[0]!.path;
    const filename = path.join(distDir, assetPath);
    await truncate(filename, EXPECTED_MAX_RELEASE_ASSET_BYTES + 1);
    await chmod(filename, 0o000);

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      `Asset exceeds maximum before read for ${assetPath}.`,
    );
  });

  it('detects corpus tampering', async () => {
    const { projectRoot, distDir } = await temporaryProject('tampered');
    const release = await buildFixtureRelease({ projectRoot, distDir });
    const corpusPath = path.join(distDir, release.contentPath.slice(1));
    const corpus = JSON.parse(await readFile(corpusPath, 'utf8')) as {
      items: Array<{ reflection: string }>;
    };
    corpus.items[0]!.reflection = `${corpus.items[0]!.reflection} TAMPERED`;
    await writeFile(corpusPath, JSON.stringify(corpus), 'utf8');

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /canonical|hash|tamper/iu,
    );
  });

  it('detects private metadata leakage before publication', async () => {
    const { projectRoot, distDir } = await temporaryProject('private-leak');
    const release = await buildFixtureRelease({ projectRoot, distDir });
    const corpusPath = path.join(distDir, release.contentPath.slice(1));
    const corpus = JSON.parse(await readFile(corpusPath, 'utf8')) as {
      items: Array<Record<string, unknown>>;
    };
    corpus.items[0]!['permissionRecordId'] = 'private-permission';
    await writeFile(corpusPath, JSON.stringify(corpus), 'utf8');

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /private|permission/iu,
    );
  });

  it('rejects a source-derived private value after every public hash is repaired', async () => {
    const { projectRoot, distDir } = await temporaryProject('rehash-private-leak');
    await buildFixtureRelease({ projectRoot, distDir });
    const privateRightsOwner =
      makeFixtureCorpus().items[0]!.translation.rights_owner;
    await rewriteCorpus(distDir, (item) => {
      item['translationCredit'] = privateRightsOwner;
    });

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /private|source|rights/iu,
    );
  });

  it('rejects any remote URI scheme after every public hash is repaired', async () => {
    const { projectRoot, distDir } = await temporaryProject('rehash-remote');
    await buildFixtureRelease({ projectRoot, distDir });
    await rewriteCorpus(distDir, (item) => {
      item['translationCredit'] = 'ftp://example.test/remote-audio';
    });

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /remote|URI|URL/iu,
    );
  });

  it.each([
    'data:text/plain,private',
    'blob:private-resource',
    'mailto:private@example.test',
    'file:/private/content.yaml',
    'tel:+61000000000',
    'ws:private-socket',
    'wss:private-socket',
    'ssh:private-host',
    'sftp:private-host',
    'https:example.test/a',
    'http:example.test/a',
    'ftp:example.test/a',
    'ftps:example.test/a',
    'javascript:alert(1)',
  ])('rejects a coherently rehashed non-hierarchical resource: %s', async (value) => {
    const { projectRoot, distDir } = await temporaryProject('rehash-resource');
    await buildFixtureRelease({ projectRoot, distDir });
    await rewriteCorpus(distDir, (item) => {
      item['translationCredit'] = value;
    });

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /remote|resource|URI|URL/iu,
    );
  });

  it('allows coherently rehashed ordinary prose containing a colon', async () => {
    const { projectRoot, distDir } = await temporaryProject('rehash-colon-prose');
    await buildFixtureRelease({ projectRoot, distDir });
    await rewriteCorpus(distDir, (item) => {
      item['translationCredit'] = 'Note: this is ordinary text';
    });

    await expect(verifyDist({ projectRoot, distDir })).resolves.toMatchObject({
      buildProfile: 'fixture',
    });
  });

  it('rejects private evidence files and unexpected output', async () => {
    const { projectRoot, distDir } = await temporaryProject('unexpected');
    await buildFixtureRelease({ projectRoot, distDir });
    await writeFile(path.join(distDir, 'rights-register.yaml'), 'private: true\n');

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /YAML|private|unexpected/iu,
    );
  });

  it('rejects source maps directly', async () => {
    const { projectRoot, distDir } = await temporaryProject('source-map');
    await buildFixtureRelease({ projectRoot, distDir });
    await writeFile(path.join(distDir, 'assets', 'app.js.map'), '{}', 'utf8');

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /source map/iu,
    );
  });

  it('rejects a coherently rehashed manifest missing compiled audio', async () => {
    const { projectRoot, distDir } = await temporaryProject('missing-manifest-audio');
    await buildFixtureRelease({ projectRoot, distDir });
    await rewriteAssetManifest(distDir, (manifest) => {
      manifest.assets = [];
    });

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /audio|manifest|missing|join/iu,
    );
  });

  it('rejects a coherently rehashed orphan audio manifest entry', async () => {
    const { projectRoot, distDir } = await temporaryProject('orphan-manifest-audio');
    await buildFixtureRelease({ projectRoot, distDir });
    const digest = createHash('sha256').update(TEST_ONLY_AUDIO_BYTES).digest('hex');
    const orphanPath = `audio/orphan-${digest.slice(0, 8)}.mp3`;
    await writeFile(path.join(distDir, orphanPath), TEST_ONLY_AUDIO_BYTES);
    await rewriteAssetManifest(distDir, (manifest) => {
      manifest.assets.push({
        path: orphanPath,
        mimeType: 'audio/mpeg',
        sha256: digest,
        bytes: TEST_ONLY_AUDIO_BYTES.byteLength,
        requiredOffline: false,
      });
    });

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /orphan|audio|manifest/iu,
    );
  });

  it('rejects duplicate audio manifest entries', async () => {
    const { projectRoot, distDir } = await temporaryProject('duplicate-manifest-audio');
    await buildFixtureRelease({ projectRoot, distDir });
    await rewriteAssetManifest(distDir, (manifest) => {
      manifest.assets.push(structuredClone(manifest.assets[0]!));
    });

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /duplicate|asset|path/iu,
    );
  });

  it('rejects fixture leakage if a distribution claims production eligibility', async () => {
    const { projectRoot, distDir } = await temporaryProject('fixture-leak');
    await buildFixtureRelease({ projectRoot, distDir });
    const releasePath = path.join(distDir, 'release.json');
    const release = JSON.parse(await readFile(releasePath, 'utf8')) as {
      buildProfile: string;
      productionEligible: boolean;
    };
    release.buildProfile = 'production';
    release.productionEligible = true;
    const { canonicalStringify } = await import('../../src/lib/content/canonical');
    await writeFile(releasePath, canonicalStringify(release), 'utf8');

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /fixture|TEST ONLY/iu,
    );
  });

  it('rejects a non-UTC release timestamp even when it represents the same instant', async () => {
    const { projectRoot, distDir } = await temporaryProject('non-utc');
    await buildFixtureRelease({ projectRoot, distDir });
    const releasePath = path.join(distDir, 'release.json');
    const release = JSON.parse(await readFile(releasePath, 'utf8')) as {
      builtAt: string;
    };
    release.builtAt = '2026-07-13T10:00:00.000+10:00';
    const { canonicalStringify } = await import('../../src/lib/content/canonical');
    await writeFile(releasePath, canonicalStringify(release), 'utf8');

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /UTC|builtAt|timestamp/iu,
    );
  });

  it('rejects a symlinked dist root before resolving it', async () => {
    const { projectRoot, distDir } = await temporaryProject('verify-symlink-root');
    await buildFixtureRelease({ projectRoot, distDir });
    const realDist = path.join(projectRoot, 'real-dist');
    await rename(distDir, realDist);
    await symlink(realDist, distDir);

    await expect(verifyDist({ projectRoot, distDir })).rejects.toThrow(
      /symlink|distribution root/iu,
    );
  });
});
