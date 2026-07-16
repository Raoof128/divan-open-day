import { describe, expect, it } from 'vitest';

import { authoringContentItemSchema } from '../../src/lib/content/authoringSchema';
import { validateItemAlignment } from '../../src/lib/content/compileCorpus';
import { compileItem } from '../../src/lib/content/compileItem';
import { registryBundleSchema } from '../../src/lib/content/registrySchemas';
import { machineAuthorityDigests } from '../../src/lib/content/reviewAuthority';
import { makeFixtureCorpus } from '../fixtures/content/corpus';

const BUILD_DATE = '2026-07-13';

function machineItem() {
  const corpus = makeFixtureCorpus();
  const raw = structuredClone(corpus.items[1]!);
  Object.assign(raw, { review: null, reflection: null });
  raw.translation.translator_ids = [];
  const binding = {
    englishSourceId: raw.source.english_source_id,
    englishSourceHash: raw.source.english_source_sha256,
    englishReference: raw.source.english_source_reference,
    persianSourceId: raw.source.edition_id,
    persianSourceHash: raw.source.persian_source_sha256,
    persianReference: `${raw.source.reference_type}:${raw.source.reference_value}`,
    englishLines: raw.text.english_lines,
    persianLines: raw.text.persian_lines,
    mapping: raw.text.mapping.map((entry) => ({
      englishIndex: entry.english_index,
      persianIndices: entry.persian_indices,
    })),
  };
  const digests = machineAuthorityDigests(binding);
  Object.assign(raw, {
    review_authority: {
      kind: 'machine_alignment',
      model: 'gpt-5.5-codex',
      methodVersion: 'source-bound-alignment-v1',
      englishSourceHash: binding.englishSourceHash,
      persianSourceHash: binding.persianSourceHash,
      englishSpanHash: digests.englishSpanHash,
      persianSpanHash: digests.persianSpanHash,
      mappingHash: digests.mappingHash,
      verdict: 'MACHINE_VERIFIED',
      confidence: 0.98,
      disclosures: [],
      verifiedAt: '2026-07-12',
      rationale:
        'Synthetic source-bound evidence exists only to exercise the production authority gate.',
    },
  });
  return {
    item: authoringContentItemSchema.parse(raw),
    registries: registryBundleSchema.parse(corpus.registries),
  };
}

describe('production machine authority gate', () => {
  it('accepts current embedded machine authority', () => {
    const { item, registries } = machineItem();
    expect(() =>
      validateItemAlignment(item, registries, BUILD_DATE),
    ).not.toThrow();
  });

  it('rejects human authority in the production machine gate', () => {
    const corpus = makeFixtureCorpus();
    const item = authoringContentItemSchema.parse(corpus.items[1]);
    const registries = registryBundleSchema.parse(corpus.registries);
    expect(() => validateItemAlignment(item, registries, BUILD_DATE)).toThrow(
      /machine alignment authority/iu,
    );
  });

  it('invalidates an edited selected span', () => {
    const { item, registries } = machineItem();
    const changed = structuredClone(item);
    changed.text.english_lines[0] = 'Changed after verification';
    expect(() =>
      validateItemAlignment(changed, registries, BUILD_DATE),
    ).toThrow(/selected-span/iu);
  });

  it('keeps private authority rationale and hashes out of public output', () => {
    const { item } = machineItem();
    const serialized = JSON.stringify(compileItem(item));
    expect(serialized).not.toContain('rationale');
    expect(serialized).not.toContain('SpanHash');
    expect(serialized).not.toContain('SourceHash');
  });
});
