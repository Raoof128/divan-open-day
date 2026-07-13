import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { installDivanServiceWorker } from '../../src-sw/service-worker';

describe('local-only offline artifacts', () => {
  it('provides an exact local Society-only install manifest', async () => {
    const manifest = JSON.parse(
      await readFile('public/manifest.webmanifest', 'utf8'),
    ) as Record<string, unknown>;

    expect(manifest).toEqual({
      name: 'DIVAN — Persian Poetry Experience',
      short_name: 'DIVAN',
      description:
        'A private, bilingual Persian poetry experience from the Persian Society.',
      id: '/',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0B1026',
      theme_color: '#0B1026',
      lang: 'en',
      dir: 'ltr',
      icons: [
        {
          src: 'icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
    });
    expect(JSON.stringify(manifest)).not.toMatch(
      /Macquarie|University|https?:/u,
    );
  });

  it('provides a semantic, script-free, local-link-only recovery page', async () => {
    const offline = await readFile('public/offline.html', 'utf8');

    expect(offline).toContain('<html lang="en" dir="ltr">');
    expect(offline).toContain('<h1>DIVAN is not ready offline yet</h1>');
    expect(offline).toContain('Persian Society');
    expect(offline).not.toMatch(
      /<script|<style|https?:|Macquarie|University/iu,
    );
    expect(
      [...offline.matchAll(/href="([^"]+)"/gu)].map((match) => match[1]),
    ).toEqual(['/', '/about', '/privacy', '/accessibility']);
  });

  it('exports a hand-controlled worker installer for the root build seam', () => {
    expect(installDivanServiceWorker).toBeTypeOf('function');
  });
});
