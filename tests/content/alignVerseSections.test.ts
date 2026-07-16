import { describe, expect, it } from 'vitest';

import {
  alignVerseUnit,
  englishBookFromDocumentPath,
  scoreTitles,
  type PersianSection,
} from '../../scripts/poetry/align-verse-sections';

/**
 * Ground-truth section titles transcribed from the Nicholson Persian staging.
 * Short titles only — identification, not reproduction.
 */
const SECTIONS: readonly PersianSection[] = [
  { sequence: 0, title: 'نی‌نامه', rawTextSha256: 'a'.repeat(64) },
  { sequence: 1, title: 'پادشاه و کنیزک', rawTextSha256: 'b'.repeat(64) },
  {
    sequence: 65,
    title: 'انکار کردن موسی بر مناجات شبان',
    rawTextSha256: 'c'.repeat(64),
  },
  {
    sequence: 121,
    title: 'بقیه‌ی عمارت کردن سلیمان علیه‌السلام مسجد اقصی را',
    rawTextSha256: 'd'.repeat(64),
  },
  {
    sequence: 361,
    title: 'حکایت آن اعرابی کی سگ او از گرسنگی می‌مرد',
    rawTextSha256: 'e'.repeat(64),
  },
  {
    sequence: 466,
    title: 'داستان پیر چنگی کی در عهد عمر رضی الله عنه',
    rawTextSha256: 'f'.repeat(64),
  },
];

function unit(title: string, book: number | null = 1) {
  return {
    segmentId: 'seg-1',
    title,
    storyHeading: title,
    book,
  };
}

describe('source-aware verse section alignment', () => {
  it('ranks the Song of the Reed first for the reed-flute Prologue', () => {
    // Substring matching used to bury this: "نی" occurs inside unrelated words.
    const aligned = alignVerseUnit(unit('PROLOGUE. The reed-flute'), SECTIONS);

    expect(aligned.candidates[0]?.persianSequence).toBe(0);
    expect(aligned.candidates[0]?.persianTitle).toBe('نی‌نامه');
  });

  it('ranks the King and the Handmaid first for Story I', () => {
    const aligned = alignVerseUnit(
      unit('STORY I. The Prince and the Handmaid.'),
      SECTIONS,
    );

    // "handmaid"/"کنیزک" carries the match alone: پادشاه (king) is ubiquitous in
    // the Masnavi and is deliberately absent from the lexicon, so it adds no
    // score. One identifying term still ranks the right section first.
    expect(aligned.candidates[0]?.persianSequence).toBe(1);
    expect(aligned.candidates[0]?.score).toBe(1);
    expect(aligned.candidates[0]?.anchors).toEqual([
      { english: 'handmaid', persian: 'کنیزک' },
    ]);
  });

  it('aligns Moses and the Shepherd to the shepherd section, not Solomon', () => {
    // The defective packet paired this English with sequence 121, which is
    // Solomon building the temple. The audit called that a mismatch; the matcher
    // must independently reach the same conclusion from the titles alone.
    const aligned = alignVerseUnit(
      unit('STORY VII. Moses and the Shepherd.'),
      SECTIONS,
    );

    expect(aligned.candidates[0]?.persianSequence).toBe(65);
    expect(
      aligned.candidates.map((candidate) => candidate.persianSequence),
    ).not.toContain(121);
  });

  it('shares no identifying term between Moses/Shepherd and the Solomon section', () => {
    const match = scoreTitles(
      'STORY VII. Moses and the Shepherd.',
      'بقیه‌ی عمارت کردن سلیمان علیه‌السلام مسجد اقصی را',
    );

    expect(match.score).toBe(0);
    expect(match.anchors).toEqual([]);
  });

  it('does not match on generic devotional vocabulary', () => {
    // "love"/"heart" recur across the whole Masnavi and identify nothing. A
    // scorer that pairs on them reproduces the defect this replaces.
    const match = scoreTitles(
      'Description of Love and the Heart.',
      'در بیان عشق و دل',
    );

    expect(match.score).toBe(0);
  });

  it('reports no signal rather than inventing a best guess', () => {
    const aligned = alignVerseUnit(
      unit('STORY XX. Something With No Named Figure.'),
      SECTIONS,
    );

    expect(aligned.noSignal).toBe(true);
    expect(aligned.candidates).toEqual([]);
  });

  it('reads the English book from the EPUB document path', () => {
    expect(
      englishBookFromDocumentPath('OPS/c4_Masnavi_I_Ma_navi_Book_IV.xhtml'),
    ).toBe(4);
    expect(englishBookFromDocumentPath('OPS/about.xhtml')).toBeNull();
  });

  it('is deterministic and ties break toward the more specific title', () => {
    const first = alignVerseUnit(unit('STORY VIII. The Harper.'), SECTIONS);
    const second = alignVerseUnit(unit('STORY VIII. The Harper.'), SECTIONS);

    expect(first).toEqual(second);
    expect(first.candidates[0]?.persianSequence).toBe(466);
  });
});
