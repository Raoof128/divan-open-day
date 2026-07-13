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

/**
 * Build a self-contained SVG share card with an original decorative frame and
 * live bilingual text. Persian shaping is preserved because the text is live
 * (not rasterised here); if a browser cannot preserve shaping when rasterising,
 * callers fall back to text copy per §15.2. Contains no remote or scripted
 * references.
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

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="DIVAN verse share card">',
    '  <rect x="0" y="0" width="1080" height="1080" fill="#0f1020"/>',
    `  <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="${accentColor}" stroke-width="6"/>`,
    `  <rect x="64" y="64" width="952" height="952" fill="none" stroke="${accentColor}" stroke-width="2"/>`,
    `  <text x="540" y="360" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="46" fill="#f4ecd8">${english}</text>`,
    `  <text x="540" y="470" text-anchor="middle" direction="rtl" font-family="Vazirmatn, Tahoma, sans-serif" font-size="52" fill="#f4ecd8" xml:lang="fa">${persian}</text>`,
    `  <text x="540" y="700" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="30" fill="${accentColor === '#7b1f2b' ? '#e6b8bf' : '#b8c4e6'}">— ${poet}</text>`,
    `  <text x="540" y="760" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="22" fill="#c9c3b0">${reference}</text>`,
    `  <text x="540" y="800" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="20" fill="#c9c3b0">${credit}</text>`,
    `  <text x="540" y="960" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="24" fill="#f4ecd8">${society}</text>`,
    `  <text x="540" y="1000" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="20" fill="#c9c3b0">${url}</text>`,
    '</svg>',
  ].join('\n');
}
