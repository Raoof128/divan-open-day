import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

async function coreCss(): Promise<string> {
  return readFile(resolve(process.cwd(), 'src/app/core.css'), 'utf8');
}

function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`${escaped}\\s*\\{(?<body>[^}]*)\\}`, 'u').exec(css)
    ?.groups?.['body'] ?? '';
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
    expect(reducedMedia).toContain('[data-motion-preference=\'system\']');
    expect(reducedMedia).not.toMatch(/^\s*\*,/mu);
    expect(css).toContain("[data-motion-preference='reduced']");
  });
});
