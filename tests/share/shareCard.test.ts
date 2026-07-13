import { describe, expect, it } from 'vitest';

import type { PublicContentItem } from '../../src/contracts/content';
import {
  DEFAULT_SHARE_CONFIG,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  buildShareCardSvg,
  buildShareText,
} from '../../src/lib/share/shareCard';

const item: PublicContentItem = {
  id: 'hafez-0001',
  schemaVersion: 2,
  poet: 'hafez',
  mode: 'open_the_divan',
  display: { visualVariant: 'garden_night', accent: 'pomegranate' },
  source: {
    workEn: 'The Divan',
    workFa: 'دیوان',
    editionPublicCredit: 'Public edition credit',
    reference: 'Ghazal 1, lines 1-2',
    openingHemistichFa: 'الا یا ایها الساقی',
  },
  text: {
    persianLines: ['خط اول فارسی', 'خط دوم فارسی'],
    englishLines: ['First English line', 'Second English line'],
    alignment: 'line',
  },
  translationClassification: 'society_translation',
  translationCredit: 'Translated by the Society',
  reflection: 'A reflection, not a prediction.',
  audio: null,
  contentHash: 'abc123',
};

const config = {
  siteUrl: 'https://example.test/divan',
  society: 'Test Society',
};

describe('buildShareText', () => {
  it('includes the required §15.1 fields generated locally', () => {
    const text = buildShareText(item, config);
    expect(text).toContain('First English line');
    expect(text).toContain('خط اول فارسی');
    expect(text).toContain('Hafez');
    expect(text).toContain('Ghazal 1, lines 1-2'); // edition-specific reference
    expect(text).toContain('Translated by the Society'); // translation credit
    expect(text).toContain('Test Society'); // society identity
    expect(text).toContain('https://example.test/divan'); // short site URL
  });

  it('never leaks a private intention or the reflection body', () => {
    const text = buildShareText(item, config);
    // The visitor intention is never part of the public item, and the reflection
    // is explicitly excluded from share content per §15.2 privacy rules.
    expect(text).not.toContain('A reflection, not a prediction.');
    expect(text.toLowerCase()).not.toContain('intention');
  });

  it('labels Rumi distinctly from Hafez', () => {
    const rumi = { ...item, poet: 'rumi' as const };
    expect(buildShareText(rumi, config)).toContain('Rumi');
  });

  it('provides a default config that is a conspicuous non-production placeholder', () => {
    expect(DEFAULT_SHARE_CONFIG.society.length).toBeGreaterThan(0);
    // Must not fabricate approved University branding before the launch gate.
    expect(DEFAULT_SHARE_CONFIG.society.toLowerCase()).not.toContain(
      'macquarie',
    );
  });
});

describe('buildShareCardSvg', () => {
  it('returns a self-contained SVG with a decorative frame and live bilingual text', () => {
    const svg = buildShareCardSvg(item, config);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('First English line');
    expect(svg).toContain('خط اول فارسی');
    // Persian shaping is preserved by live SVG text carrying direction metadata.
    expect(svg).toContain('direction="rtl"');
  });

  it('contains no remote or scripted fetch vectors', () => {
    // The visible site URL text is allowed (§15.1); what is forbidden is any
    // element/attribute that would fetch a remote resource or execute script.
    const svg = buildShareCardSvg(item, config);
    expect(svg).not.toContain('<script');
    expect(svg).not.toMatch(/\bhref\s*=/u);
    expect(svg).not.toMatch(/\bsrc\s*=/u);
    expect(svg).not.toMatch(/<image\b/u);
    expect(svg).not.toMatch(/url\(/u); // no CSS url() references
  });

  it('meets the 1200×630 logical link-preview floor', () => {
    const svg = buildShareCardSvg(item, config);
    expect(SHARE_CARD_WIDTH).toBeGreaterThanOrEqual(1200);
    expect(SHARE_CARD_HEIGHT).toBeGreaterThanOrEqual(630);
    expect(svg).toContain(
      `width="${String(SHARE_CARD_WIDTH)}" height="${String(SHARE_CARD_HEIGHT)}"`,
    );
    expect(svg).toContain(
      `viewBox="0 0 ${String(SHARE_CARD_WIDTH)} ${String(SHARE_CARD_HEIGHT)}"`,
    );
  });

  it('places the English excerpt before the Persian excerpt', () => {
    const svg = buildShareCardSvg(item, config);
    const englishIndex = svg.indexOf('First English line');
    const persianIndex = svg.indexOf('خط اول فارسی');
    expect(englishIndex).toBeGreaterThan(-1);
    expect(persianIndex).toBeGreaterThan(englishIndex);
  });

  it('carries the credit line, Society identity, and source reference', () => {
    const svg = buildShareCardSvg(item, config);
    expect(svg).toContain('Translated by the Society');
    expect(svg).toContain('Test Society');
    expect(svg).toContain('Ghazal 1, lines 1-2');
  });

  it('keeps every text bold and above the thumbnail legibility floor', () => {
    const svg = buildShareCardSvg(item, config);
    const textCount = [...svg.matchAll(/<text\b/gu)].length;
    const weights = [...svg.matchAll(/font-weight="(\d+)"/gu)].map((match) =>
      Number(match[1]),
    );
    const sizes = [...svg.matchAll(/font-size="(\d+)"/gu)].map((match) =>
      Number(match[1]),
    );
    expect(textCount).toBeGreaterThan(0);
    expect(weights).toHaveLength(textCount);
    expect(sizes).toHaveLength(textCount);
    for (const weight of weights) {
      expect(weight).toBeGreaterThanOrEqual(600);
    }
    for (const size of sizes) {
      expect(size).toBeGreaterThanOrEqual(24);
    }
    // The bilingual verse pair is the single focal point: both excerpt sizes
    // clear a display-size floor above every supporting line.
    const sorted = sizes.toSorted((left, right) => right - left);
    expect(sorted[0] ?? 0).toBeGreaterThanOrEqual(48);
    expect(sorted[1] ?? 0).toBeGreaterThanOrEqual(48);
  });

  it('draws no thin hairline strokes that recompression destroys', () => {
    const svg = buildShareCardSvg(item, config);
    const strokes = [...svg.matchAll(/stroke-width="(\d+(?:\.\d+)?)"/gu)].map(
      (match) => Number(match[1]),
    );
    expect(strokes.length).toBeGreaterThan(0);
    for (const strokeWidth of strokes) {
      expect(strokeWidth).toBeGreaterThanOrEqual(8);
    }
  });

  it('omits the URL line entirely when no approved short URL exists', () => {
    const svg = buildShareCardSvg(item, DEFAULT_SHARE_CONFIG);
    expect(svg).not.toMatch(/>\s*<\/text>/u);
    expect(svg).toContain(DEFAULT_SHARE_CONFIG.society);
  });

  it('escapes angle brackets in content to prevent markup injection', () => {
    const evil = {
      ...item,
      text: {
        ...item.text,
        englishLines: ['<script>x</script>'],
        persianLines: ['x'],
      },
    };
    const svg = buildShareCardSvg(evil, config);
    expect(svg).not.toContain('<script>x</script>');
    expect(svg).toContain('&lt;script&gt;');
  });
});
