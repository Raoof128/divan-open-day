import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

import {
  ALLOWED_SOURCE_HOSTS,
  SOURCE_EDITION_IDS,
  sourceRegistrySchema,
} from '../../src/lib/content/sourceRegistrySchema';

const registryPath = resolve(
  process.cwd(),
  'sources-private/poetry/registry.yaml',
);

function loadRegistry(): unknown {
  return parseYaml(readFileSync(registryPath, 'utf8'));
}

function validSource(overrides: Record<string, unknown> = {}) {
  return {
    id: 'hafez-qazvini-ghani-fa-wikisource',
    poet: 'hafez',
    language: 'fa',
    work_title: 'دیوان حافظ',
    edition_label: 'Qazvini–Ghani edition (Persian Wikisource)',
    completeness: 'complete',
    canonical_page_url:
      'https://fa.wikisource.org/wiki/%D8%AF%DB%8C%D9%88%D8%A7%D9%86_%D8%AD%D8%A7%D9%81%D8%B8',
    download_artifacts: [
      {
        kind: 'epub',
        url: 'https://ws-export.wmcloud.org/?format=epub&lang=fa&page=X',
        required: true,
        max_bytes: 20_000_000,
      },
    ],
    rights: {
      original_status: 'Public domain in Iran and the United States.',
      transcription_licence: 'CC BY-SA',
      attribution_required: true,
      evidence_url: 'https://fa.wikisource.org/wiki/X',
    },
    ...overrides,
  };
}

describe('source registry schema', () => {
  it('exposes the four fixed source edition ids', () => {
    expect([...SOURCE_EDITION_IDS]).toEqual([
      'hafez-qazvini-ghani-fa-wikisource',
      'hafez-bell-1897-en',
      'rumi-nicholson-fa-wikisource',
      'rumi-whinfield-abridged-en',
    ]);
  });

  it('accepts a well-formed source edition', () => {
    const parsed = sourceRegistrySchema.parse({
      schema_version: 1,
      sources: [
        validSource(),
        validSource({
          id: 'hafez-bell-1897-en',
          poet: 'hafez',
          language: 'en',
          completeness: 'selection',
        }),
        validSource({
          id: 'rumi-nicholson-fa-wikisource',
          poet: 'rumi',
          language: 'fa',
          completeness: 'complete',
        }),
        validSource({
          id: 'rumi-whinfield-abridged-en',
          poet: 'rumi',
          language: 'en',
          completeness: 'abridged',
        }),
      ],
    });
    expect(parsed.sources).toHaveLength(4);
  });

  it('rejects unknown keys', () => {
    expect(() =>
      sourceRegistrySchema.parse({
        schema_version: 1,
        sources: [validSource({ surprise: 'nope' })],
      }),
    ).toThrow();
  });

  it('rejects non-HTTPS urls', () => {
    expect(() =>
      sourceRegistrySchema.parse({
        schema_version: 1,
        sources: [
          validSource({
            canonical_page_url: 'http://fa.wikisource.org/wiki/X',
          }),
        ],
      }),
    ).toThrow();
  });

  it('rejects urls on a non-allowlisted host', () => {
    expect(() =>
      sourceRegistrySchema.parse({
        schema_version: 1,
        sources: [
          validSource({
            canonical_page_url: 'https://example.com/wiki/X',
          }),
        ],
      }),
    ).toThrow();
  });

  it('rejects a registry missing one of the four fixed ids', () => {
    expect(() =>
      sourceRegistrySchema.parse({
        schema_version: 1,
        sources: [validSource()],
      }),
    ).toThrow();
  });

  it('rejects duplicate source ids', () => {
    expect(() =>
      sourceRegistrySchema.parse({
        schema_version: 1,
        sources: [validSource(), validSource(), validSource(), validSource()],
      }),
    ).toThrow();
  });

  it('exposes the allowlisted hosts', () => {
    expect(ALLOWED_SOURCE_HOSTS).toContain('archive.org');
    expect(ALLOWED_SOURCE_HOSTS).toContain('ws-export.wmcloud.org');
    expect(ALLOWED_SOURCE_HOSTS).toContain('fa.wikisource.org');
    expect(ALLOWED_SOURCE_HOSTS).toContain('en.wikisource.org');
  });

  describe('the committed registry.yaml', () => {
    it('parses and validates against the schema', () => {
      const parsed = sourceRegistrySchema.parse(loadRegistry());
      expect(parsed.sources.map((s) => s.id).sort()).toEqual(
        [...SOURCE_EDITION_IDS].sort(),
      );
    });

    it('marks Bell as a selection and Whinfield as abridged', () => {
      const parsed = sourceRegistrySchema.parse(loadRegistry());
      const bell = parsed.sources.find((s) => s.id === 'hafez-bell-1897-en');
      const whinfield = parsed.sources.find(
        (s) => s.id === 'rumi-whinfield-abridged-en',
      );
      expect(bell?.completeness).toBe('selection');
      expect(whinfield?.completeness).toBe('abridged');
    });

    it('marks both Persian editions complete', () => {
      const parsed = sourceRegistrySchema.parse(loadRegistry());
      for (const id of [
        'hafez-qazvini-ghani-fa-wikisource',
        'rumi-nicholson-fa-wikisource',
      ]) {
        expect(parsed.sources.find((s) => s.id === id)?.completeness).toBe(
          'complete',
        );
      }
    });
  });
});
