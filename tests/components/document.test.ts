import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('document shell', () => {
  it('sets meaningful root metadata without inline script or style', async () => {
    const html = await readFile(resolve(process.cwd(), 'index.html'), 'utf8');

    expect(html).toMatch(/<html\s+lang="en"\s+dir="ltr">/u);
    expect(html).toMatch(/<title>DIVAN — Persian Poetry Experience<\/title>/u);
    expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]+"/u);
    expect(html).not.toMatch(/<style(?:\s|>)/u);
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/u);
  });

  it('provides useful privacy-safe noscript recovery and static links', async () => {
    const html = await readFile(resolve(process.cwd(), 'index.html'), 'utf8');
    const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/u)?.[1] ?? '';

    expect(noscript).toMatch(/Persian poetry/u);
    expect(noscript).toMatch(/privacy/u);
    expect(noscript).toMatch(/stall/u);
    expect(noscript).toMatch(/href="\/about"[^>]*>About/u);
    expect(noscript).toMatch(/href="\/credits"[^>]*>Credits/u);
    expect(noscript).toMatch(/requires JavaScript/u);
    expect(noscript).not.toMatch(/Macquarie University/u);
  });
});
