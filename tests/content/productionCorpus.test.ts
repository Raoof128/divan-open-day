import { describe, expect, it } from 'vitest';

import { loadContentPrivate } from '../../scripts/content/loadContent';
import { compileCorpus } from '../../src/lib/content/compileCorpus';
import { RUMI_ARCHIVED_SELECTION } from '../../src/lib/content/productionSelection';

const PROJECT_ROOT = process.cwd();

describe('canonical production corpus', () => {
  it('compiles exactly 24 Hafez and 16 Rumi source-bound records', async () => {
    const loaded = await loadContentPrivate({
      projectRoot: PROJECT_ROOT,
      profile: 'production',
    });
    const compiled = compileCorpus({
      profile: 'production',
      items: loaded.items,
      registries: loaded.registries,
      buildDate: '2026-07-16',
    });

    expect(compiled).toMatchObject({
      hafezCount: 24,
      rumiCount: 16,
      totalCount: 40,
      productionEligible: true,
    });
    expect(
      loaded.items.every(
        (item) =>
          item.review_authority.kind === 'machine_alignment' &&
          item.review_authority.verdict !== 'EXCLUDED',
      ),
    ).toBe(true);
  });

  it('keeps all five archived Rumi alignments outside production', async () => {
    const loaded = await loadContentPrivate({
      projectRoot: PROJECT_ROOT,
      profile: 'production',
    });
    const sourceReferences = new Set(
      loaded.items.map((item) => item.source.english_source_reference),
    );

    for (const archived of RUMI_ARCHIVED_SELECTION) {
      expect(sourceReferences.has(archived.segmentId)).toBe(false);
    }
  });

  it('does not emit private authority hashes, mappings, or rationales', async () => {
    const loaded = await loadContentPrivate({
      projectRoot: PROJECT_ROOT,
      profile: 'production',
    });
    const compiled = compileCorpus({
      profile: 'production',
      items: loaded.items,
      registries: loaded.registries,
      buildDate: '2026-07-16',
    });
    const serialized = JSON.stringify(compiled.items);

    expect(serialized).not.toMatch(
      /englishSourceHash|persianSourceHash|SpanHash|mappingHash|rationale/iu,
    );
    expect(serialized).not.toContain('english_source_reference');
    expect(
      compiled.items.every((item) => item.text.englishLines.length > 0),
    ).toBe(true);
    expect(
      compiled.items.every((item) => item.text.persianLines.length > 0),
    ).toBe(true);
  });
});
