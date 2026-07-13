import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

async function coreCss(): Promise<string> {
  return readFile(resolve(process.cwd(), 'src/app/core.css'), 'utf8');
}

async function visualCss(): Promise<string> {
  return readFile(resolve(process.cwd(), 'src/styles/visual.css'), 'utf8');
}

function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return (
    new RegExp(`${escaped}\\s*\\{(?<body>[^}]*)\\}`, 'u').exec(css)?.groups?.[
      'body'
    ] ?? ''
  );
}

describe('CSS accessibility guardrails', () => {
  it('gives primary interactive controls a 44 by 44 CSS-pixel floor', async () => {
    const css = await coreCss();
    const controls = rule(css, 'a,\nbutton,\nselect');
    expect(controls).toMatch(/min-block-size:\s*44px/u);
    expect(controls).toMatch(/min-inline-size:\s*44px/u);
  });

  it('uses a fixed two-tone focus treatment independent of current text colour', async () => {
    const css = await coreCss();
    const focus = rule(css, ':focus-visible');
    expect(focus).toMatch(/outline:\s*[^;]+#[0-9a-f]{6}/iu);
    expect(focus).toMatch(/box-shadow:\s*[^;]+#[0-9a-f]{6}/iu);
    expect(focus).not.toMatch(/currentColor/u);
  });

  it('reveals the skip link above browser chrome without clipping its focused state', async () => {
    const css = await coreCss();
    const skip = rule(css, '.skip-link');
    const focusedSkip = rule(css, '.skip-link:focus');
    expect(skip).toMatch(/position:\s*fixed/u);
    expect(skip).not.toMatch(/overflow:\s*hidden/u);
    expect(focusedSkip).toMatch(/inset-block-start:\s*[^;]+/u);
  });

  it('permits 320px reflow, text spacing, and document scrolling', async () => {
    const css = await coreCss();
    const body = rule(css, 'body');
    expect(body).not.toMatch(/min-inline-size:\s*320px/u);
    expect(body).not.toMatch(/overflow(?:-x|-y)?:\s*hidden/u);
    expect(css).toMatch(/\.scene\s*\{[^}]*overflow-wrap:\s*anywhere/su);
    expect(css).not.toMatch(/position:\s*sticky/u);
  });

  it('scopes system reduced-motion CSS so an explicit Full choice can override it', async () => {
    const css = await coreCss();
    const reducedMedia = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{(?<body>[\s\S]*)\}\s*$/u,
    )?.groups?.['body'];
    expect(reducedMedia).toContain("[data-motion-preference='system']");
    expect(reducedMedia).not.toMatch(/^\s*\*,/mu);
    expect(css).toContain("[data-motion-preference='reduced']");
  });

  it('changes reduced reveal opacity over a bounded 120 to 180 millisecond transition', async () => {
    const css = await coreCss();
    const entering = rule(
      css,
      ".reveal-scene[data-motion='reduced'][data-reveal-phase='entering']",
    );
    const visible = rule(
      css,
      ".reveal-scene[data-motion='reduced'][data-reveal-phase='visible']",
    );

    expect(entering).toMatch(/opacity:\s*0\s*;/u);
    expect(visible).toMatch(/opacity:\s*1\s*;/u);
    expect(visible).toMatch(/transition:\s*opacity\s+120ms\b/u);
  });

  it('keeps the illuminated spine bar clear of text at every width', async () => {
    const css = await visualCss();
    const frame = rule(css, '.illuminated-frame');

    // Bar right edge sits at 1.62rem; start padding must never drop below 2rem.
    expect(frame).toMatch(
      /padding-inline-start:\s*max\(2rem,\s*clamp\(1\.25rem,\s*5vw,\s*4rem\)\)/u,
    );
    expect(frame).toMatch(
      /padding-inline-end:\s*clamp\(1\.25rem,\s*5vw,\s*4rem\)/u,
    );

    const narrow =
      /@media\s*\(max-width:\s*24rem\)\s*\{(?<body>[\s\S]*?)\n\}/u.exec(css)
        ?.groups?.['body'] ?? '';
    expect(narrow).toMatch(
      /\.illuminated-frame\s*\{[^}]*padding-inline:\s*2rem\s+1\.25rem/u,
    );
  });

  it('renders links on light paper documents in an accessible dark colour', async () => {
    const css = await visualCss();
    const links = rule(css, '.context-document a');
    expect(links).toMatch(/color:\s*var\(--deep-red\)/u);
    expect(links).toMatch(/text-decoration-color:/u);
  });

  it('keys result-card accents to each poet visual language', async () => {
    const css = await visualCss();
    expect(css).toMatch(
      /\.poem-result\[data-visual-language='lamp-constellation'\][^{]*\.illuminated-frame::after\s*\{[^}]*var\(--lapis\)/u,
    );
    expect(css).toMatch(
      /\.poem-result\[data-visual-language='lamp-constellation'\][^{]*\.illuminated-frame::before\s*\{[^}]*rgb\(23 74 126/u,
    );
    expect(css).toMatch(
      /\.poem-result\[data-visual-language='lamp-constellation'\][^{]*\.illuminated-frame__ornament\s*\{[^}]*color:\s*var\(--lapis\)/u,
    );
  });

  it('gives the Persian welcome line typographic parity with the headline', async () => {
    const css = await visualCss();
    const persian = rule(css, '.welcome-persian');
    expect(persian).toMatch(
      /font-size:\s*clamp\(1\.5rem,\s*4\.5vw,\s*2\.2rem\)/u,
    );
  });

  it('never lets Persian connected script inherit letter tracking', async () => {
    const css = await coreCss();
    const fa = rule(css, "[lang='fa']");
    expect(fa).toMatch(/letter-spacing:\s*0\s*;/u);
  });

  it('hardens fixed chrome against display cutouts with safe-area padding', async () => {
    // Physical env() names: the logical safe-area-inset-inline-* variants are
    // not shipped, and an unknown env() name invalidates the declaration.
    const css = await coreCss();
    expect(rule(css, '.skip-link')).toMatch(
      /max\(0\.5rem,\s*env\(safe-area-inset-left\)\)/u,
    );
    expect(rule(css, '.skip-link:focus')).toMatch(
      /max\(0\.5rem,\s*env\(safe-area-inset-top\)\)/u,
    );
    expect(rule(css, '.utility-header')).toMatch(/env\(safe-area-inset-top\)/u);
    expect(rule(css, '.scene')).toMatch(/env\(safe-area-inset-left\)/u);
    expect(rule(css, '.scene')).toMatch(/env\(safe-area-inset-right\)/u);
  });
});
