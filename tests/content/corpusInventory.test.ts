import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildCorpusInventory } from '../../scripts/poetry/build-corpus-inventory';
import { loadContentPrivate } from '../../scripts/content/loadContent';

describe('pre-expansion corpus inventory', () => {
  it('classifies every current production record and reports the remaining 60/60 gap', async () => {
    const loaded = await loadContentPrivate({
      projectRoot: process.cwd(),
      profile: 'production',
    });

    const inventory = buildCorpusInventory({
      items: loaded.items,
      buildDate: '2026-07-16',
      targetPerPoet: 60,
    });

    expect(inventory.records).toHaveLength(40);
    expect(inventory.summary).toMatchObject({
      validUniqueHafezCount: 24,
      validUniqueRumiCount: 16,
      finalContractStaleAuthorityCount: 40,
      duplicateHafezGhazalCount: 0,
      overlappingRumiSpanCount: 0,
      excludedCount: 0,
      remainingHafezRequired: 36,
      remainingRumiRequired: 44,
    });
    expect(
      inventory.records.every(
        (record) =>
          record.sourceEvidenceCurrent &&
          !record.finalContractAuthorityCurrent &&
          record.failureReasons.includes(
            'Machine authority does not bind the canonical identity.',
          ),
      ),
    ).toBe(true);
  });

  it('enumerates every current Hafez and Rumi candidate without copying source books', async () => {
    const inventory = JSON.parse(
      await readFile(
        path.join(
          process.cwd(),
          'docs/verification/2026-07-16-pre-expansion-corpus-inventory.json',
        ),
        'utf8',
      ),
    ) as {
      readonly candidates: ReadonlyArray<{
        readonly poet: 'hafez' | 'rumi';
        readonly englishSourceHash: string;
        readonly persianSourceHash: string;
      }>;
    };
    const { candidates } = inventory;

    expect(candidates).toHaveLength(386);
    expect(
      candidates.filter((candidate) => candidate.poet === 'hafez'),
    ).toHaveLength(278);
    expect(
      candidates.filter((candidate) => candidate.poet === 'rumi'),
    ).toHaveLength(108);
    expect(
      candidates.every(
        (candidate) =>
          candidate.englishSourceHash.length === 64 &&
          candidate.persianSourceHash.length === 64 &&
          !('englishText' in candidate) &&
          !('persianText' in candidate),
      ),
    ).toBe(true);
  });
});
