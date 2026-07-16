import { describe, expect, it } from 'vitest';

import {
  parseBellOcr,
  type BellCandidate,
} from '../../scripts/poetry/extract-hafez-bell';

// A conspicuously synthetic OCR excerpt exercising common defects. NOT poetry.
const SAMPLE_OCR = `POEMS FROM THE DIVAN OF HAFIZ

12

I.

THE  garden  strewn  with  ro-
ses in the TEST ONLY dawn,
the  wind  a  scattered  song.

13

II.

ARISE  and  fill  a  gob-let of
the NOT POETRY morning wine.

NOTES

These notes are apparatus, not verse.
`;

describe('parseBellOcr', () => {
  const candidates = parseBellOcr(SAMPLE_OCR);

  it('produces candidate sections tagged for the Bell source', () => {
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    for (const candidate of candidates) {
      expect(candidate.sourceId).toBe('hafez-bell-1897-en');
    }
  });

  it('retains raw OCR lines verbatim and never auto-corrects', () => {
    const first = candidates[0] as BellCandidate;
    // The hyphenated "ro-\nses" split must survive untouched in rawOcrLines.
    const joined = first.rawOcrLines.join('\n');
    expect(joined).toContain('ro-');
    expect(first.correctedDraftLines).toEqual([]);
    expect(first.requiresVisualVerification).toBe(true);
  });

  it('captures roman-numeral headings (normalised to the bare numeral)', () => {
    const headings = candidates.map((c) => c.heading);
    expect(headings).toContain('I');
    expect(headings).toContain('II');
  });

  it('links page-number cues seen before a section', () => {
    // "12" precedes section I; "13" precedes section II.
    const first = candidates.find((c) => c.heading === 'I');
    const second = candidates.find((c) => c.heading === 'II');
    expect(first?.pdfPageStart).toBe(12);
    expect(second?.pdfPageStart).toBe(13);
  });

  it('flags suspicious lines (hyphenation, sentinels) without editing them', () => {
    const first = candidates[0] as BellCandidate;
    expect(first.suspiciousLineIndexes.length).toBeGreaterThan(0);
    // Flagging does not mutate the raw text.
    expect(first.rawOcrLines.join('\n')).toContain('ro-');
  });

  it('excludes front-matter and notes apparatus from verse candidates', () => {
    const headings = candidates.map((c) => c.heading);
    expect(headings).not.toContain('NOTES');
    // The title banner is not a verse candidate.
    for (const candidate of candidates) {
      expect(candidate.rawOcrLines.join(' ')).not.toContain(
        'POEMS FROM THE DIVAN OF HAFIZ',
      );
    }
  });

  it('is deterministic for the same input', () => {
    expect(parseBellOcr(SAMPLE_OCR)).toEqual(candidates);
  });
});
