import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

import { SOURCE_EDITION_IDS } from '../../src/lib/content/sourceRegistrySchema';
import { sourceRightsEvidenceSchema } from '../../src/lib/content/sourceRightsSchema';

const evidencePath = resolve(
  process.cwd(),
  'sources-private/poetry/rights-evidence.yaml',
);

function loadEvidence(): unknown {
  return parseYaml(readFileSync(evidencePath, 'utf8'));
}

function validRecord(overrides: Record<string, unknown> = {}) {
  return {
    source_id: 'hafez-bell-1897-en',
    poet: 'hafez',
    work_title: 'Poems from the Divan of Hafiz',
    contributor: 'Gertrude Lowthian Bell',
    publication_year: 1897,
    completeness: 'selection',
    original_status: 'Internet Archive records the item as NOT_IN_COPYRIGHT.',
    transcription_licence: 'Public domain (1897 edition)',
    evidence_url: 'https://archive.org/details/poemsfromdivanof00hafiiala',
    required_public_credit:
      'English translation: Gertrude Lowthian Bell, Poems from the Divan of Hafiz, 1897.',
    source_lock_reference: null,
    rights_reviewer_id: null,
    status: 'pending',
    ...overrides,
  };
}

describe('source rights evidence schema', () => {
  it('accepts a pending record with no reviewer and no acquired hash', () => {
    expect(() =>
      sourceRightsEvidenceSchema.parse({
        schema_version: 1,
        records: [
          validRecord(),
          validRecord({
            source_id: 'hafez-qazvini-ghani-fa-wikisource',
            poet: 'hafez',
            language: 'fa',
            completeness: 'complete',
            publication_year: null,
          }),
          validRecord({
            source_id: 'rumi-nicholson-fa-wikisource',
            poet: 'rumi',
            completeness: 'complete',
            publication_year: null,
          }),
          validRecord({
            source_id: 'rumi-whinfield-abridged-en',
            poet: 'rumi',
            completeness: 'abridged',
            publication_year: null,
          }),
        ],
      }),
    ).not.toThrow();
  });

  it('refuses to mark a record approved without a human rights reviewer', () => {
    expect(() =>
      sourceRightsEvidenceSchema.parse({
        schema_version: 1,
        records: [
          validRecord({
            status: 'approved',
            rights_reviewer_id: null,
            source_lock_reference: 'a'.repeat(64),
          }),
        ],
      }),
    ).toThrow();
  });

  it('refuses to mark a record approved without an acquired source hash', () => {
    expect(() =>
      sourceRightsEvidenceSchema.parse({
        schema_version: 1,
        records: [
          validRecord({
            status: 'approved',
            rights_reviewer_id: 'rights-reviewer-1',
            source_lock_reference: null,
          }),
        ],
      }),
    ).toThrow();
  });

  it('rejects "ai" as a rights reviewer', () => {
    expect(() =>
      sourceRightsEvidenceSchema.parse({
        schema_version: 1,
        records: [
          validRecord({
            status: 'approved',
            rights_reviewer_id: 'ai',
            source_lock_reference: 'a'.repeat(64),
          }),
        ],
      }),
    ).toThrow();
  });

  it('rejects unknown keys', () => {
    expect(() =>
      sourceRightsEvidenceSchema.parse({
        schema_version: 1,
        records: [validRecord({ nope: true })],
      }),
    ).toThrow();
  });
});

describe('the committed rights-evidence.yaml', () => {
  it('validates and covers all four source editions', () => {
    const parsed = sourceRightsEvidenceSchema.parse(loadEvidence());
    expect(parsed.records.map((r) => r.source_id).sort()).toEqual(
      [...SOURCE_EDITION_IDS].sort(),
    );
  });

  it('honestly records every source as pending (no fabricated approvals)', () => {
    const parsed = sourceRightsEvidenceSchema.parse(loadEvidence());
    for (const record of parsed.records) {
      expect(record.status).toBe('pending');
      expect(record.rights_reviewer_id).toBeNull();
    }
  });

  it('marks Bell a selection and Whinfield abridged', () => {
    const parsed = sourceRightsEvidenceSchema.parse(loadEvidence());
    expect(
      parsed.records.find((r) => r.source_id === 'hafez-bell-1897-en')
        ?.completeness,
    ).toBe('selection');
    expect(
      parsed.records.find((r) => r.source_id === 'rumi-whinfield-abridged-en')
        ?.completeness,
    ).toBe('abridged');
  });
});
