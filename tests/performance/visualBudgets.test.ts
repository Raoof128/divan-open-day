import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';
import { build as viteBuild } from 'vite';

async function source(path: string): Promise<string> {
  try {
    return await readFile(resolve(process.cwd(), path), 'utf8');
  } catch {
    return '';
  }
}

async function filesBelow(root: string, directory = root): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? filesBelow(root, path) : [path];
    }),
  );
  return nested.flat();
}

describe('locked visual system', () => {
  it('defines every authoritative colour exactly once', async () => {
    const css = await source('src/styles/tokens.css');
    const tokens = {
      '--ink-night': '#0B1026',
      '--ink-deep': '#11182D',
      '--lapis': '#174A7E',
      '--lapis-light': '#2E6E9E',
      '--turquoise': '#2C8C8A',
      '--pomegranate': '#A6192E',
      '--bright-red': '#D6001C',
      '--deep-red': '#76232F',
      '--gold': '#D4A64A',
      '--gold-light': '#E7C777',
      '--parchment': '#F2E6CF',
      '--paper': '#FFF9EE',
      '--cypress': '#204F40',
      '--charcoal': '#2E302E',
      '--muted-ink': '#6E675D',
      '--error': '#B42318',
      '--focus': '#78D6FF',
    } as const;
    for (const [name, value] of Object.entries(tokens)) {
      expect(css.match(new RegExp(`${name}:\\s*${value}`, 'giu'))).toHaveLength(1);
    }
  });

  it('self-hosts only the four approved font families with swap and no remote URL', async () => {
    const css = await source('src/styles/fonts.css');
    expect(css).toContain('@fontsource/inter');
    expect(css).toContain('@fontsource/cormorant-garamond');
    expect(css).toContain('@fontsource/vazirmatn');
    expect(css).toContain('@fontsource/noto-nastaliq-urdu');
    expect(css).not.toMatch(/https?:|fonts\.googleapis|fonts\.gstatic/iu);
    expect(css).toContain('font-display: swap');
  });

  it('animates only transform, opacity, and bounded stroke properties', async () => {
    const css = `${await source('src/styles/visual.css')}\n${await source('src/styles/motion.css')}`;
    expect(css).not.toMatch(/transition(?:-property)?:[^;]*(?:width|height|top|left)/iu);
    expect(css).not.toMatch(/@keyframes[\s\S]*?\{[\s\S]*?(?:width|height|top|left):/iu);
    expect(css).not.toMatch(/filter:\s*blur\([^)]*(?:[2-9]\d|\d{3,})px/iu);
    expect(css).toContain("[data-motion='reduced']");
    expect(css).toContain('@media (pointer: coarse)');
  });

  it('keeps authored CSS under the critical 45 KB ceiling', async () => {
    const paths = [
      'src/app/core.css',
      'src/styles/tokens.css',
      'src/styles/fonts.css',
      'src/styles/visual.css',
      'src/styles/motion.css',
    ];
    const css = await Promise.all(paths.map(source));
    expect(Buffer.byteLength(css.join('\n'))).toBeLessThanOrEqual(45_000);
  });

  it('keeps the production-mode browser shell within compressed initial budgets', async () => {
    const temporaryRoot = resolve(process.cwd(), '.tmp-tests');
    await mkdir(temporaryRoot, { recursive: true });
    const output = await mkdtemp(resolve(temporaryRoot, 'visual-budget-'));
    try {
      await viteBuild({
        root: process.cwd(),
        configFile: resolve(process.cwd(), 'vite.config.ts'),
        logLevel: 'silent',
        build: {
          emptyOutDir: true,
          outDir: output,
        },
      });
      const paths = await filesBelow(output);
      const assets = await Promise.all(
        paths.map(async (path) => ({
          path,
          bytes: await readFile(path),
        })),
      );
      const compressed = (extension: string) =>
        assets
          .filter(({ path }) => path.endsWith(extension))
          .reduce((total, { bytes }) => total + gzipSync(bytes).byteLength, 0);
      const criticalFonts = assets
        .filter(({ path }) =>
          path.endsWith('.woff2') &&
          !path.includes('noto-nastaliq-urdu'),
        )
        .reduce((total, { bytes }) => total + bytes.byteLength, 0);
      const initialImages = assets
        .filter(({ path }) => /\.(?:avif|gif|jpe?g|png|webp)$/iu.test(path))
        .reduce((total, { bytes }) => total + bytes.byteLength, 0);
      const html = compressed('.html');
      const css = compressed('.css');
      const javascript = compressed('.js');

      expect(html).toBeLessThanOrEqual(40_000);
      expect(css).toBeLessThanOrEqual(45_000);
      expect(javascript).toBeLessThanOrEqual(200_000);
      expect(criticalFonts).toBeLessThanOrEqual(180_000);
      expect(initialImages).toBe(0);
      expect(html + css + javascript + criticalFonts + initialImages)
        .toBeLessThanOrEqual(1_200_000);
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });
});
