import { describe, expect, it } from 'vitest';

import {
  HEADING_MIN_X_SIZE,
  NOTE_MAX_X_SIZE,
  VERSE_MIN_X_SIZE,
  classifyByTypeSize,
  parseHocrLines,
  splitOdes,
  type OcrLine,
} from '../../scripts/poetry/parse-clarke-odes';

const line = (text: string, xSize: number, page = 92): OcrLine => ({
  text,
  xSize,
  page,
  volume: 'volume-1',
});

describe('Clarke verse/notes classification', () => {
  it('keeps the size bands ordered with a valley between notes and verse', () => {
    expect(NOTE_MAX_X_SIZE).toBeLessThan(VERSE_MIN_X_SIZE);
    expect(VERSE_MIN_X_SIZE).toBeLessThan(HEADING_MIN_X_SIZE);
  });

  it('classifies verse-sized type as pairable', () => {
    expect(
      classifyByTypeSize(
        line('If that Bold One of Shiraz gain our heart,', 58),
      ),
    ).toBe('verse_translation');
  });

  it('classifies note-sized type as commentary', () => {
    expect(classifyByTypeSize(line('Turk signifies :—', 49))).toBe(
      'commentary',
    );
  });

  it('classifies the valley as uncertain, never as verse', () => {
    for (let size = NOTE_MAX_X_SIZE + 1; size < VERSE_MIN_X_SIZE; size += 1) {
      expect(classifyByTypeSize(line('ambiguous line', size))).toBe(
        'uncertain',
      );
    }
  });

  it('classifies running heads as heading regardless of size', () => {
    expect(classifyByTypeSize(line('49 DIVAN-I-HAFIZ.', 58))).toBe('heading');
    expect(classifyByTypeSize(line('THE LETTER ALIF 41', 57))).toBe('heading');
  });

  /**
   * The defect this whole module exists to prevent. Clarke's gloss shares every
   * anchor with the couplet it explains, so a text-based filter cannot separate
   * them — "Samarkand va Bukhara signifies :— Faith and the world" would pair
   * just as readily as the verse. Only the type size distinguishes them.
   */
  it('excludes a gloss that repeats the couplet anchors verbatim', () => {
    const lines = [
      line('8, (6).', 71),
      line('1. If that Bold One of Shiraz gain our heart,', 58),
      line('For His dark mole, I will give Samarkand and Bukhara', 58),
      line('Samarkand va Bukhara signifies :—', 49),
      line('Faith (din) and the world ; both worlds, this and the next.', 48),
    ];
    const [ode] = splitOdes(lines);
    expect(ode?.verse).toContain('Samarkand and Bukhara');
    expect(ode?.verse).not.toContain('signifies');
    expect(ode?.verse).not.toContain('Faith (din)');
    expect(ode?.noteLines).toBe(2);
  });

  /**
   * Clarke numbers his glosses with the same `N.` form as his couplets, and only
   * every fifth couplet is numbered. A numbering-based parser reads "2. Saki
   * (Cup-bearer) signifies" as couplet 2 — which is exactly how a gloss reached
   * ode 8's verse record.
   */
  it('does not mistake a numbered gloss for a numbered couplet', () => {
    const lines = [
      line('8, (6).', 71),
      line('1. If that Bold One of Shiraz gain our heart,', 58),
      line('2. Saki (Cup-bearer) signifies :—', 49),
      line('(a) the murshid.', 49),
    ];
    const [ode] = splitOdes(lines);
    expect(ode?.verse).not.toContain('murshid');
    expect(ode?.verse).not.toContain('Cup-bearer');
    expect(ode?.verseLines).toBe(1);
  });

  it('keeps unnumbered couplets, which Clarke leaves unnumbered by default', () => {
    const lines = [
      line('8, (6).', 71),
      line('1. If that Bold One of Shiraz gain our heart,', 58),
      line('Saki! give the wine remaining ;', 58),
      line('The bank of the water of the Ruknabad', 58),
    ];
    const [ode] = splitOdes(lines);
    expect(ode?.verseLines).toBe(3);
    expect(ode?.verse).toContain('Ruknabad');
  });

  it('strips the couplet number but not the verse', () => {
    const lines = [
      line('8, (6).', 71),
      line('5. By reason of that beauty that Yusuf had,', 58),
    ];
    expect(splitOdes(lines)[0]?.verse).toBe(
      'By reason of that beauty that Yusuf had,',
    );
  });

  it('keeps the ode and concordance numbers verbatim, never inferred', () => {
    const lines = [
      line('8, (6).', 71),
      line('1. verse one', 58),
      line('12, (5).', 71),
      line('1. verse two', 58),
    ];
    const odes = splitOdes(lines);
    // 9, 10 and 11 are absent from the page: the next ode is 12, not 9.
    expect(odes.map((o) => o.ode)).toEqual([8, 12]);
    expect(odes.map((o) => o.concordance)).toEqual([6, 5]);
  });

  it('counts uncertain lines rather than silently dropping them', () => {
    const lines = [
      line('8, (6).', 71),
      line('1. clear verse', 58),
      line('ambiguous', 54),
      line('a note', 48),
    ];
    const [ode] = splitOdes(lines);
    expect(ode?.uncertainLines).toBe(1);
    expect(ode?.noteLines).toBe(1);
    expect(ode?.verse).not.toContain('ambiguous');
  });
});

describe('hOCR parsing', () => {
  it('extracts line text and x_size', () => {
    const hocr = `
      <span class='ocr_line' id='line_1_1' title="bbox 0 0 10 10; x_size 58.2; x_descenders 3">
        <span class='ocrx_word'>If</span> <span class='ocrx_word'>that</span>
      </span>
      <span class='ocr_line' id='line_1_2' title="bbox 0 0 10 10; x_size 49">
        <span class='ocrx_word'>Turk</span> <span class='ocrx_word'>signifies</span>
      </span>`;
    const lines = parseHocrLines(hocr, 92);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ text: 'If that', xSize: 58.2, page: 92 });
    expect(lines[1]).toMatchObject({ text: 'Turk signifies', xSize: 49 });
  });

  it('decodes entities and skips empty lines', () => {
    const hocr = `
      <span class='ocr_line' title="x_size 58"><span class='ocrx_word'>a&amp;b</span></span>
      <span class='ocr_line' title="x_size 58"></span>`;
    const lines = parseHocrLines(hocr, 1);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.text).toBe('a&b');
  });
});
