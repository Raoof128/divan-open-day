import { describe, expect, it } from 'vitest';

import { compileItem } from '../../src/lib/content/compileItem';
import {
  buildCandidateIndex,
  candidateMappingSchema,
  type PersianStagingBlock,
  type EnglishCandidateSection,
} from '../../scripts/poetry/build-candidate-index';

const persianBlocks: PersianStagingBlock[] = [
  {
    sourceId: 'hafez-qazvini-ghani-fa-wikisource',
    sequence: 4,
    searchText: 'ساقی بیا که باده گلگون طلب کنیم',
    rawTextSha256: 'a'.repeat(64),
  },
  {
    sourceId: 'hafez-qazvini-ghani-fa-wikisource',
    sequence: 9,
    searchText: 'دل میرود ز دستم صاحبدلان خدا را',
    rawTextSha256: 'b'.repeat(64),
  },
];

const englishSections: EnglishCandidateSection[] = [
  {
    sourceId: 'hafez-bell-1897-en',
    reference: 'poem-i',
    searchText: 'arise and fill a goblet of the morning wine saki',
  },
  {
    sourceId: 'hafez-bell-1897-en',
    reference: 'poem-ii',
    searchText: 'my heart escapes me masters of the heart for god',
  },
];

describe('buildCandidateIndex', () => {
  const index = buildCandidateIndex({
    poet: 'hafez',
    persianBlocks,
    englishSections,
    topN: 2,
  });

  it('labels every record non-publishable and human-review-required', () => {
    expect(index.length).toBeGreaterThan(0);
    for (const record of index) {
      expect(record.machineGeneratedCandidate).toBe(true);
      expect(record.publishable).toBe(false);
      expect(record.requiresHumanReview).toBe(true);
      expect(record.confidence).toBe('candidate');
    }
  });

  it('never emits a verified confidence', () => {
    for (const record of index) {
      expect(record.confidence).not.toBe('verified');
    }
  });

  it('validates against the candidate schema, which rejects publishable:true', () => {
    for (const record of index) {
      expect(() => candidateMappingSchema.parse(record)).not.toThrow();
    }
    const forged = { ...index[0], publishable: true };
    expect(() => candidateMappingSchema.parse(forged)).toThrow();
  });

  it('is refused by the production content compiler (never authoring input)', () => {
    expect(() => compileItem(index[0])).toThrow();
  });

  it('is deterministic for the same input', () => {
    const again = buildCandidateIndex({
      poet: 'hafez',
      persianBlocks,
      englishSections,
      topN: 2,
    });
    expect(again).toEqual(index);
  });
});
