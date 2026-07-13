import { describe, expect, it } from 'vitest';

import {
  extractBeytLines,
  parsePdfFromPage,
} from '../../scripts/poetry/fetch-masnavi-sections';

describe('extractBeytLines', () => {
  it('extracts verse from Wikisource beyt spans and ignores chrome', () => {
    const html = `
      <table><tr><td class="b"><span class="beyt">بشنو از نی چون حکایت می‌کند</span></td></tr>
      <tr><td class="b"><span class="beyt">از جدایی‌ها شکایت می‌کند</span></td></tr></table>
      <span style="font-size:58%;">۵</span>
      <div class="pagenum">2693</div>
    `;
    expect(extractBeytLines(html)).toEqual([
      'بشنو از نی چون حکایت می‌کند',
      'از جدایی‌ها شکایت می‌کند',
    ]);
  });

  it('strips inner tags and unescapes entities inside a beyt', () => {
    const html =
      '<span class="beyt">سینه خواهم <b>شرحه</b> شرحه از&#160;فراق</span>';
    expect(extractBeytLines(html)).toEqual(['سینه خواهم شرحه شرحه از فراق']);
  });

  it('returns an empty array for an index/non-verse page', () => {
    const html = '<ul><li><a href="/x">قصه‌ی دیدن خلیفه لیلی را</a></li></ul>';
    expect(extractBeytLines(html)).toEqual([]);
  });
});

describe('parsePdfFromPage', () => {
  it('reads the Proofread page range for ordering', () => {
    const wikitext =
      '{{سرصفحه}}\n<pages index="DowreKamelMasnavi.pdf" from=9 to=10 tosection="p10-1" />';
    expect(parsePdfFromPage(wikitext)).toBe(9);
  });

  it('returns null when there is no page range', () => {
    expect(parsePdfFromPage('{{سرصفحه}} plain text')).toBeNull();
  });
});
