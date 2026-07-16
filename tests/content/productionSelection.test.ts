import { describe, expect, it } from 'vitest';

import {
  HAFEZ_PRODUCTION_SELECTION,
  RUMI_ARCHIVED_SELECTION,
  RUMI_PRODUCTION_SELECTION,
} from '../../src/lib/content/productionSelection';

describe('production poetry selection', () => {
  it('selects exactly 24 unique Bell-to-Qazvini-Ghani Hafez mappings', () => {
    expect(HAFEZ_PRODUCTION_SELECTION).toHaveLength(24);
    expect(
      new Set(HAFEZ_PRODUCTION_SELECTION.map((entry) => entry.bellPoemId)).size,
    ).toBe(24);
    expect(
      new Set(HAFEZ_PRODUCTION_SELECTION.map((entry) => entry.ghazalNumber))
        .size,
    ).toBe(24);
  });

  it('selects exactly 16 Rumi alignments and archives the other five', () => {
    expect(RUMI_PRODUCTION_SELECTION).toHaveLength(16);
    expect(RUMI_ARCHIVED_SELECTION).toHaveLength(5);
    const selected = new Set(
      RUMI_PRODUCTION_SELECTION.map((entry) => entry.segmentId),
    );
    const archived = new Set(
      RUMI_ARCHIVED_SELECTION.map((entry) => entry.segmentId),
    );
    expect([...selected].filter((id) => archived.has(id))).toEqual([]);
    expect(new Set([...selected, ...archived]).size).toBe(21);
    expect(
      RUMI_ARCHIVED_SELECTION.every((entry) => entry.verdict === 'EXCLUDED'),
    ).toBe(true);
  });

  it('archives the five lowest-ranked high-burden alignments explicitly', () => {
    expect(
      RUMI_ARCHIVED_SELECTION.map((entry) => entry.persianSequence),
    ).toEqual([116, 347, 483, 622, 668]);
    expect(
      RUMI_ARCHIVED_SELECTION.every(
        (entry) => entry.archiveReason.trim().length >= 20,
      ),
    ).toBe(true);
  });
});
