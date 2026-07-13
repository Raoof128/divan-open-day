import type { PublicContentItem } from '../../contracts/content';

/**
 * Local share content per design §15 ("Save and share"). All content is
 * generated in the browser; nothing is uploaded and no social SDK is used.
 * The visitor's private intention is never part of the public item, so it can
 * never appear here (§15.2).
 */
export interface ShareConfig {
  /** Short site URL. Resolved from the live origin at runtime; the final
   *  approved short URL is a §31.2 launch gate, never fabricated here. */
  readonly siteUrl: string;
  /** Society identity. The final approved Society wording and any University
   *  mark are a §31.2 launch gate; this default is a conspicuous placeholder. */
  readonly society: string;
}

/**
 * Conspicuous non-production placeholder. The real approved Society identity,
 * University mark, and short URL are supplied at deploy time behind the launch
 * gate; this must not fabricate approved institutional branding.
 */
export const DEFAULT_SHARE_CONFIG: ShareConfig = {
  siteUrl: '',
  society: 'Persian Society Open Day (placeholder — pending approved wording)',
};

const POET_LABELS = { hafez: 'Hafez', rumi: 'Rumi' } as const;

function firstLine(lines: readonly string[]): string {
  return lines[0] ?? '';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;');
}

/**
 * Assemble the plain-text share payload. This is the always-available fallback
 * (Web Share text / clipboard copy) and deliberately excludes the reflection
 * body and any private data.
 */
export function buildShareText(
  item: PublicContentItem,
  config: ShareConfig = DEFAULT_SHARE_CONFIG,
): string {
  const poet = POET_LABELS[item.poet];
  const english = firstLine(item.text.englishLines);
  const persian = firstLine(item.text.persianLines);
  const lines = [
    english,
    persian,
    '',
    `— ${poet}`,
    `Source: ${item.source.reference}`,
    item.translationCredit,
    config.society,
  ];
  if (config.siteUrl.length > 0) {
    lines.push(config.siteUrl);
  }
  return lines.join('\n');
}

/** Logical share-card canvas, at or above the 1200×630 link-preview floor. */
export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;

/**
 * Build a self-contained SVG share card with an original decorative frame and
 * live bilingual text. Persian shaping is preserved because the text is live
 * (not rasterised here); if a browser cannot preserve shaping when rasterising,
 * callers fall back to text copy per §15.2. Contains no remote or scripted
 * references.
 *
 * Legibility rules for messaging-app recompression: one focal point (the
 * bilingual verse pair, English first), bold high-contrast type for both
 * scripts, a credit line that stays readable at thumbnail scale, and a single
 * bold frame instead of thin hairlines that recompression destroys.
 */
export function buildShareCardSvg(
  item: PublicContentItem,
  config: ShareConfig = DEFAULT_SHARE_CONFIG,
): string {
  const poet = escapeXml(POET_LABELS[item.poet]);
  const english = escapeXml(firstLine(item.text.englishLines));
  const persian = escapeXml(firstLine(item.text.persianLines));
  const reference = escapeXml(item.source.reference);
  const credit = escapeXml(item.translationCredit);
  const society = escapeXml(config.society);
  const url = escapeXml(config.siteUrl);
  const accentColor =
    item.display.accent === 'pomegranate' ? '#7b1f2b' : '#1f3a7b';
  const attributionColor =
    item.display.accent === 'pomegranate' ? '#e6b8bf' : '#b8c4e6';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(SHARE_CARD_WIDTH)}" height="${String(SHARE_CARD_HEIGHT)}" viewBox="0 0 ${String(SHARE_CARD_WIDTH)} ${String(SHARE_CARD_HEIGHT)}" role="img" aria-label="DIVAN verse share card">`,
    '  <rect x="0" y="0" width="1200" height="630" fill="#0f1020"/>',
    `  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="${accentColor}" stroke-width="12"/>`,
    `  <text x="600" y="212" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="54" font-weight="700" fill="#f4ecd8">${english}</text>`,
    `  <text x="600" y="314" text-anchor="middle" direction="rtl" font-family="Vazirmatn, Tahoma, sans-serif" font-size="58" font-weight="700" fill="#f4ecd8" xml:lang="fa">${persian}</text>`,
    `  <text x="600" y="398" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="600" fill="${attributionColor}">— ${poet}</text>`,
    `  <text x="600" y="466" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="600" fill="#c9c3b0">${reference}</text>`,
    `  <text x="600" y="506" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="600" fill="#c9c3b0">${credit}</text>`,
    `  <text x="600" y="552" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="600" fill="#f4ecd8">${society}</text>`,
    ...(url.length > 0
      ? [
          `  <text x="600" y="590" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="600" fill="#c9c3b0">${url}</text>`,
        ]
      : []),
    '</svg>',
  ].join('\n');
}
