import { describe, expect, it } from 'vitest';

import { authoringContentItemSchema } from '../../src/lib/content/authoringSchema';
import { canonicalSha256 } from '../../src/lib/content/canonical';
import {
  compileCorpus,
  validateItemAlignment,
} from '../../src/lib/content/compileCorpus';
import { registryBundleSchema } from '../../src/lib/content/registrySchemas';
import { makeFixtureCorpus } from '../fixtures/content/corpus';

const BUILD_DATE = '2026-07-13';
const SHA_B = 'b'.repeat(64);
const SHA_C = 'c'.repeat(64);

function anchor(index: number) {
  return {
    type: 'distinctive_image' as const,
    english_evidence: `english evidence ${String(index)}`,
    persian_evidence: `persian evidence ${String(index)}`,
    explanation: `why these correspond ${String(index)}`,
  };
}

/** Parsed exactly as compileCorpus parses it, so the digests agree. */
function firstFixtureItem() {
  return authoringContentItemSchema.parse(makeFixtureCorpus().items[0]);
}

/** The first fixture item, plus a machine alignment record that verifies it. */
function itemWithAlignment(alignmentOverrides: Record<string, unknown> = {}) {
  const corpus = makeFixtureCorpus();
  const item = firstFixtureItem();

  const registries = registryBundleSchema.parse({
    ...corpus.registries,
    alignments: {
      schema_version: 1,
      alignments: [
        {
          id: 'align-01',
          item_id: item.id,
          authoring_sha256: canonicalSha256(item),
          persian_source_id: item.source.edition_id,
          persian_snapshot_sha256: SHA_B,
          english_source_id: 'hafez-bell-1897-en',
          english_snapshot_sha256: SHA_C,
          verdict: 'pass',
          classification: 'faithful_poetic_translation',
          confidence: 'high',
          anchors: [anchor(1), anchor(2), anchor(3)],
          release_eligible: true,
          human_reapproval_required: false,
          blocking_reasons: [],
          reviewed_at: '2026-07-12',
          reviewed_by_model: 'claude-opus-4-8',
          ...alignmentOverrides,
        },
      ],
    },
  });

  return { item, registries };
}

describe('production machine alignment gate', () => {
  it('accepts an item whose pairing was verified against its cited edition', () => {
    const { item, registries } = itemWithAlignment();

    expect(() =>
      validateItemAlignment(item, registries, BUILD_DATE),
    ).not.toThrow();
  });

  // The gap this gate exists to close: a human can approve a mispaired record.
  it('refuses an item with no alignment record at all', () => {
    const registries = registryBundleSchema.parse(
      makeFixtureCorpus().registries,
    );

    expect(() =>
      validateItemAlignment(firstFixtureItem(), registries, BUILD_DATE),
    ).toThrow(/missing machine alignment/iu);
  });

  it('refuses an alignment bound to a different item', () => {
    const { item, registries } = itemWithAlignment({
      item_id: 'some-other-item',
    });

    expect(() => validateItemAlignment(item, registries, BUILD_DATE)).toThrow(
      /missing machine alignment/iu,
    );
  });

  // Edit the poem after verification and the verdict is void.
  it('refuses an alignment whose digest no longer matches the item', () => {
    const { item, registries } = itemWithAlignment({
      authoring_sha256: 'd'.repeat(64),
    });

    expect(() => validateItemAlignment(item, registries, BUILD_DATE)).toThrow(
      /digest does not match/iu,
    );
  });

  it('refuses a blocked verdict', () => {
    const { item, registries } = itemWithAlignment({
      verdict: 'blocked',
      classification: 'mismatch',
      confidence: 'low',
      anchors: [],
      release_eligible: false,
      blocking_reasons: ['English passage is a different ghazal.'],
    });

    expect(() => validateItemAlignment(item, registries, BUILD_DATE)).toThrow(
      /not release eligible/iu,
    );
  });

  it('refuses a corrected mapping until a human re-approves it', () => {
    const { item, registries } = itemWithAlignment({
      verdict: 'needs_human_reapproval',
      release_eligible: false,
      human_reapproval_required: true,
    });

    expect(() => validateItemAlignment(item, registries, BUILD_DATE)).toThrow(
      /not release eligible|renewed human approval/iu,
    );
  });

  it('refuses a future-effective alignment', () => {
    const { item, registries } = itemWithAlignment({
      reviewed_at: '2099-01-01',
    });

    expect(() => validateItemAlignment(item, registries, BUILD_DATE)).toThrow(
      /future-effective/iu,
    );
  });

  it('refuses an alignment reached against a different Persian edition', () => {
    const { item, registries } = itemWithAlignment({
      persian_source_id: 'some-other-edition',
    });

    expect(() => validateItemAlignment(item, registries, BUILD_DATE)).toThrow(
      /different Persian edition/iu,
    );
  });
});

describe('machine alignment and the existing pipeline', () => {
  // Synthetic fixtures are not real poetry; there is nothing to verify.
  it('does not require alignment evidence for a fixture build', () => {
    const corpus = makeFixtureCorpus();

    expect(() =>
      compileCorpus({
        profile: 'fixture',
        items: corpus.items,
        registries: corpus.registries,
        buildDate: BUILD_DATE,
      }),
    ).not.toThrow();
  });

  it('defaults to an empty alignment registry, which fails production closed', () => {
    const registries = registryBundleSchema.parse(
      makeFixtureCorpus().registries,
    );

    expect(registries.alignments).toEqual({
      schema_version: 1,
      alignments: [],
    });

    expect(() =>
      validateItemAlignment(firstFixtureItem(), registries, BUILD_DATE),
    ).toThrow(/missing machine alignment/iu);
  });

  it('keeps alignment evidence out of the compiled public item', () => {
    const { registries } = itemWithAlignment();
    const corpus = makeFixtureCorpus();

    const compiled = compileCorpus({
      profile: 'fixture',
      items: corpus.items,
      registries,
      buildDate: BUILD_DATE,
    });

    const serialized = JSON.stringify(compiled);
    expect(serialized).not.toContain('anchors');
    expect(serialized).not.toContain('english evidence');
    expect(serialized).not.toContain('persian evidence');
    expect(serialized).not.toContain('claude-opus-4-8');
    expect(serialized).not.toContain('faithful_poetic_translation');
  });
});
