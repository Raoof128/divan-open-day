import { describe, expect, it } from 'vitest';

import {
  buildPoems,
  classifyPage,
  corroborate,
  isFurniture,
  normaliseForComparison,
  romanHeading,
  splitPoems,
  verseOnlyPages,
  type PageLine,
} from '../../scripts/poetry/reconstruct-bell';

/**
 * Regression suite for the Bell reconstruction, recorded in
 * docs/audits/divan/2026-07-15-bell-reconstruction-and-rumi-alignment.md.
 *
 * The staged Bell text is Internet Archive OCR and is not publishable: it reads
 * "easb" where the page says "east". This pins the three defects found while
 * building a second, independent reading — all three of which were mine, not
 * the OCR's.
 *
 * No source poetry appears here. The fixtures are structural shapes with
 * TEST ONLY sentinels.
 */

function page(number: number, lines: string[]): PageLine[] {
  return lines.map((text) => ({ page: number, text }));
}

describe('Bell page classification', () => {
  it('classifies the prose introduction by its running head', () => {
    // The defect: splitting on Roman numerals alone swept Bell's prose essay on
    // Hafiz in as "poem I" - 155 lines of commentary published as verse, the
    // same class of error that invalidated the Whinfield prose summaries.
    expect(classifyPage(['INTRODUCTION', 'TEST ONLY prose line'])).toBe(
      'prose',
    );
    expect(classifyPage(['POEMS FROM THE', 'TEST ONLY verse line'])).toBe(
      'verse',
    );
    expect(classifyPage(['DIVAN OF HAFIZ', 'TEST ONLY verse line'])).toBe(
      'verse',
    );
    expect(classifyPage(['TEST ONLY orphan line'])).toBe('unknown');
  });

  it('drops every page of the prose section', () => {
    const pages = [
      ...page(65, ['INTRODUCTION', 'TEST ONLY essay about the poet']),
      ...page(66, ['TEST ONLY essay continues with no running head']),
      ...page(71, ['POEMS FROM THE', 'I', 'TEST ONLY verse line']),
    ];
    const kept = verseOnlyPages(pages);
    const text = kept.map((line) => line.text).join('\n');
    expect(text).not.toContain('essay');
    expect(text).toContain('TEST ONLY verse line');
  });

  it('carries classification forward when a running head is not read', () => {
    // Page 66 has no head of its own; it belongs to the prose section it
    // follows, exactly as the Whinfield classifier carries NOTES forward.
    const pages = [
      ...page(65, ['INTRODUCTION', 'TEST ONLY prose a']),
      ...page(66, ['TEST ONLY prose b']),
    ];
    expect(verseOnlyPages(pages)).toEqual([]);
  });

  it('drops front matter that precedes any recognised running head', () => {
    const pages = page(1, ['TEST ONLY title page']);
    expect(verseOnlyPages(pages)).toEqual([]);
  });
});

describe('Bell heading detection', () => {
  it('accepts a valid Roman numeral as certain', () => {
    expect(romanHeading('XXVII')).toEqual({ asRead: 'XXVII', certain: true });
    expect(romanHeading('IX.')).toEqual({ asRead: 'IX', certain: true });
  });

  it('finds the boundary for an OCR-damaged numeral but marks it uncertain', () => {
    // The OCR reads II as "Il" and III as "Ul". Requiring a strictly valid
    // numeral missed the heading entirely and merged poems II and III into I.
    expect(romanHeading('Il')).toEqual({ asRead: 'Il', certain: false });
    expect(romanHeading('Ul')).toEqual({ asRead: 'Ul', certain: false });
    expect(romanHeading('XXVILI')).toEqual({
      asRead: 'XXVILI',
      certain: false,
    });
  });

  it('never treats a printed page number as a heading', () => {
    // Scan page 115 carries printed page number 111. Allowing digits in the
    // heading shape split a poem in half.
    expect(romanHeading('111')).toBeNull();
    expect(romanHeading('7')).toBeNull();
    expect(isFurniture('111')).toBe(true);
  });

  it('rejects ordinary words', () => {
    expect(romanHeading('TEST ONLY line of verse')).toBeNull();
  });

  it('splits poems at headings and keeps the numeral as read', () => {
    const pages = [
      ...page(71, [
        'POEMS FROM THE',
        'I',
        'TEST ONLY a',
        'TEST ONLY b',
        'TEST ONLY c',
        'TEST ONLY d',
      ]),
      ...page(72, [
        'POEMS FROM THE',
        'Il',
        'TEST ONLY e',
        'TEST ONLY f',
        'TEST ONLY g',
        'TEST ONLY h',
      ]),
    ];
    const poems = splitPoems(verseOnlyPages(pages));
    expect(poems).toHaveLength(2);
    expect(poems[0]?.bellNumber).toBe('I');
    expect(poems[0]?.numeralCertain).toBe(true);
    // Recorded verbatim and flagged - not silently renumbered to "II". One
    // missed heading would shift every later poem's reference.
    expect(poems[1]?.bellNumber).toBe('Il');
    expect(poems[1]?.numeralCertain).toBe(false);
  });
});

describe('two-reading corroboration', () => {
  it('treats punctuation and case variance as agreement, not conflict', () => {
    // This was my bug, not the OCR's. The archive prints Bell's small-caps
    // opening word in full caps and sets punctuation off with spaces. Comparing
    // with punctuation kept made "word !" and "word!" a conflict and flagged
    // 396 perfectly good lines as disputed. The question is only whether two
    // readings agree on the WORDS.
    //
    // Shape reproduced with sentinels, not Bell's verse: leading small-caps
    // word, spaced punctuation, doubled spaces.
    const archive = 'TEST  ONLY  sentinel,  line  !  and  more';
    const fresh = 'Test only sentinel, line! and more';
    expect(normaliseForComparison(archive)).toBe(normaliseForComparison(fresh));
  });

  it('still reports a real word disagreement', () => {
    // The live defect this guards: the archive reads "easb" where the page says
    // "east". A single substituted word is a genuine conflict and must survive
    // normalisation rather than be smoothed away.
    const archive = 'TEST  ONLY  sentinel  easb  line';
    const fresh = 'TEST ONLY sentinel east line';
    expect(normaliseForComparison(archive)).not.toBe(
      normaliseForComparison(fresh),
    );
  });

  it('marks a line corroborated only when the other reading contains it', () => {
    const archive = new Set([normaliseForComparison('TEST ONLY agreed line')]);
    const lines = corroborate(
      ['TEST ONLY agreed line', 'TEST ONLY conflicting line'],
      archive,
    );
    expect(lines[0]?.status).toBe('corroborated');
    expect(lines[1]?.status).toBe('disputed');
  });

  it('publishes a poem only when both readings agree on every line', () => {
    const pages = page(71, [
      'POEMS FROM THE',
      'I',
      'TEST ONLY alpha',
      'TEST ONLY beta',
      'TEST ONLY gamma',
      'TEST ONLY delta',
    ]);
    const archiveAll = [
      'TEST  ONLY  alpha',
      'TEST  ONLY  beta',
      'TEST  ONLY  gamma',
      'TEST  ONLY  delta',
    ].join('\n');

    const [agreed] = buildPoems(pages, archiveAll);
    expect(agreed?.disputedLines).toBe(0);
    expect(agreed?.publishable).toBe(true);

    // One line the second reading does not corroborate is one chance to publish
    // a machine's guess as Gertrude Bell's poetry.
    const [conflicted] = buildPoems(
      pages,
      archiveAll.replace('gamma', 'gamrna'),
    );
    expect(conflicted?.disputedLines).toBe(1);
    expect(conflicted?.publishable).toBe(false);
  });

  it('excludes the prose introduction from built poems', () => {
    const pages = [
      ...page(65, [
        'INTRODUCTION',
        'I',
        'TEST ONLY essay sentence one',
        'TEST ONLY essay sentence two',
        'TEST ONLY essay three',
        'TEST ONLY essay four',
      ]),
      ...page(71, [
        'POEMS FROM THE',
        'I',
        'TEST ONLY verse one',
        'TEST ONLY verse two',
        'TEST ONLY verse three',
        'TEST ONLY verse four',
      ]),
    ];
    const poems = buildPoems(pages, '');
    expect(poems).toHaveLength(1);
    expect(poems[0]?.scanPageStart).toBe(71);
    expect(
      poems.flatMap((p) => p.lines.map((l) => l.text)).join('\n'),
    ).not.toContain('essay');
  });
});
