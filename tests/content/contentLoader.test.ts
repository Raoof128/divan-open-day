import { mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { stringify } from 'yaml';
import { afterEach, describe, expect, it } from 'vitest';

import {
  loadContentPrivate,
  parseStrictYaml,
  readStrictYamlFile,
} from '../../scripts/content/loadContent';
import { makeFixtureCorpus } from '../fixtures/content/corpus';

const temporaryDirectories: string[] = [];

async function makeProject(): Promise<string> {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'divan-content-loader-'));
  temporaryDirectories.push(projectRoot);
  await mkdir(path.join(projectRoot, 'content-private', 'hafez'), {
    recursive: true,
  });
  await mkdir(path.join(projectRoot, 'content-private', 'rumi'), {
    recursive: true,
  });
  return projectRoot;
}

async function writeFixtureTree(projectRoot: string): Promise<void> {
  const fixture = makeFixtureCorpus();
  const firstHafez = fixture.items.find((item) => item.poet === 'hafez');
  const firstRumi = fixture.items.find((item) => item.poet === 'rumi');
  if (firstHafez === undefined || firstRumi === undefined) {
    throw new Error('TEST ONLY fixture corpus must contain both poets.');
  }

  const root = path.join(projectRoot, 'content-private');
  await Promise.all([
    writeFile(
      path.join(root, 'hafez', `${firstHafez.id}.yaml`),
      stringify(firstHafez),
      'utf8',
    ),
    writeFile(
      path.join(root, 'rumi', `${firstRumi.id}.yaml`),
      stringify(firstRumi),
      'utf8',
    ),
    ...Object.entries(fixture.registries).map(([name, registry]) =>
      writeFile(path.join(root, `${name}.yaml`), stringify(registry), 'utf8'),
    ),
  ]);
}

afterEach(async () => {
  const directories = temporaryDirectories.splice(0);
  await Promise.all(
    directories.map(async (directory) => {
      const { rm } = await import('node:fs/promises');
      await rm(directory, { recursive: true, force: true });
    }),
  );
});

describe('strict YAML parsing', () => {
  it('rejects duplicate mapping keys', () => {
    expect(() => parseStrictYaml('schema_version: 1\nschema_version: 1\n', 'duplicate.yaml')).toThrow(
      /duplicate|unique/iu,
    );
  });

  it('rejects aliases and anchors', () => {
    expect(() =>
      parseStrictYaml('value: &shared TEST\ncopy: *shared\n', 'alias.yaml'),
    ).toThrow(/alias|anchor/iu);
  });

  it('rejects multiple YAML documents', () => {
    expect(() =>
      parseStrictYaml('---\nvalue: one\n---\nvalue: two\n', 'multi.yaml'),
    ).toThrow(/multiple|document/iu);
  });

  it('rejects custom YAML tags', () => {
    expect(() => parseStrictYaml('value: !private TEST\n', 'tag.yaml')).toThrow(
      /tag/iu,
    );
  });

  it('rejects remote URLs anywhere in parsed data', () => {
    expect(() =>
      parseStrictYaml(
        'nested:\n  source: "private source at https://example.test/private"\n',
        'remote.yaml',
      ),
    ).toThrow(/remote|URL/iu);
  });

  it.each([
    'ftp://example.test/private',
    'custom+scheme://example.test/private',
    '//cdn.example.test/private',
    'data:text/plain,private',
    'blob:private-resource',
    'mailto:private@example.test',
    'file:/private/content.yaml',
    'tel:+61000000000',
    'ws:private-socket',
    'wss:private-socket',
    'ssh:private-host',
    'sftp:private-host',
  ])('rejects every URI scheme and protocol-relative remote value: %s', (value) => {
    expect(() =>
      parseStrictYaml(`nested:\n  source: ${JSON.stringify(value)}\n`, 'remote.yaml'),
    ).toThrow(/remote|URL|URI/iu);
  });

  it('does not treat ordinary prose containing a colon as a remote resource', () => {
    expect(() =>
      parseStrictYaml(
        'nested:\n  source: "Note: this is ordinary text"\n',
        'prose.yaml',
      ),
    ).not.toThrow();
  });
});

describe('content-private filesystem loading', () => {
  it('loads schema-validated fixture records from the fixed private layout', async () => {
    const projectRoot = await makeProject();
    await writeFixtureTree(projectRoot);

    const loaded = await loadContentPrivate({ projectRoot, profile: 'fixture' });

    expect(loaded.items).toHaveLength(2);
    expect(loaded.items.map((item) => item.poet).toSorted()).toEqual([
      'hafez',
      'rumi',
    ]);
    expect(loaded.registries.assets.assets).toHaveLength(1);
  });

  it('rejects path traversal outside content-private', async () => {
    const projectRoot = await makeProject();
    await writeFile(path.join(projectRoot, 'outside.yaml'), 'value: TEST\n', 'utf8');

    await expect(
      readStrictYamlFile(
        path.join(projectRoot, 'content-private'),
        '../outside.yaml',
      ),
    ).rejects.toThrow(/escape|outside|path/iu);
  });

  it('rejects symlinks instead of following them', async () => {
    const projectRoot = await makeProject();
    const outside = path.join(projectRoot, 'outside.yaml');
    await writeFile(outside, 'value: TEST\n', 'utf8');
    await symlink(
      outside,
      path.join(projectRoot, 'content-private', 'hafez', 'linked.yaml'),
    );

    await expect(
      loadContentPrivate({ projectRoot, profile: 'fixture' }),
    ).rejects.toThrow(/symlink/iu);
  });

  it('rejects unexpected files in the private source tree', async () => {
    const projectRoot = await makeProject();
    await writeFixtureTree(projectRoot);
    await writeFile(
      path.join(projectRoot, 'content-private', 'private-notes.txt'),
      'TEST ONLY',
      'utf8',
    );

    await expect(
      loadContentPrivate({ projectRoot, profile: 'fixture' }),
    ).rejects.toThrow(/unexpected/iu);
  });

  it('rejects authoring data that fails the reviewed schema', async () => {
    const projectRoot = await makeProject();
    await writeFixtureTree(projectRoot);
    await writeFile(
      path.join(
        projectRoot,
        'content-private',
        'hafez',
        'test-only-hafez-01.yaml',
      ),
      'schema_version: 2\npoet: unknown\n',
      'utf8',
    );

    await expect(
      loadContentPrivate({ projectRoot, profile: 'fixture' }),
    ).rejects.toThrow(/authoring|schema|invalid/iu);
  });

  it('fails production discovery on the repository fixture sentinels', async () => {
    const projectRoot = await makeProject();
    await writeFixtureTree(projectRoot);

    await expect(
      loadContentPrivate({ projectRoot, profile: 'production' }),
    ).rejects.toThrow(/fixture|TEST ONLY/iu);
  });

  it('reports the precise closed gate when no approved production corpus exists', async () => {
    const projectRoot = await makeProject();

    await expect(
      loadContentPrivate({ projectRoot, profile: 'production' }),
    ).rejects.toThrow(
      'Production build blocked: no approved production corpus exists in content-private.',
    );
  });
});
