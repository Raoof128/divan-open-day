import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { afterAll, describe, expect, test } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '../..');
const tsx = resolve(projectRoot, 'node_modules/.bin/tsx');
const outputDirectory = mkdtempSync(resolve(tmpdir(), 'divan-qr-test-'));
const destination = 'https://divan.raoufabedini.dev';

afterAll(() => {
  rmSync(outputDirectory, { recursive: true, force: true });
});

describe('QR production pack', () => {
  test('generates vector and print artefacts with an integrity manifest', () => {
    const result = spawnSync(
      tsx,
      [
        resolve(projectRoot, 'scripts/qr/generate-qr.ts'),
        '--url',
        destination,
        '--output',
        outputDirectory,
      ],
      { cwd: projectRoot, encoding: 'utf8' },
    );

    expect(result.status, result.stderr).toBe(0);

    const manifest = JSON.parse(
      readFileSync(resolve(outputDirectory, 'qr-manifest.json'), 'utf8'),
    ) as {
      destination: string;
      errorCorrectionLevel: string;
      quietZoneModules: number;
      artefacts: ReadonlyArray<{ file: string; sha256: string }>;
    };

    expect(manifest.destination).toBe(destination);
    expect(manifest.errorCorrectionLevel).toBe('M');
    expect(manifest.quietZoneModules).toBe(4);
    expect(manifest.artefacts.map(({ file }) => file)).toEqual([
      'divan-qr.svg',
      'divan-qr-monochrome-backup.svg',
      'a3-hero-poster.pdf',
      'a5-table-stand.pdf',
      'take-home-card.pdf',
      'staff-troubleshooting-card.pdf',
    ]);

    for (const artefact of manifest.artefacts) {
      const path = resolve(outputDirectory, artefact.file);
      expect(statSync(path).size).toBeGreaterThan(100);
      const digest = createHash('sha256')
        .update(readFileSync(path))
        .digest('hex');
      expect(artefact.sha256).toBe(digest);
      if (artefact.file.endsWith('.pdf')) {
        expect(readFileSync(path).subarray(0, 5).toString()).toBe('%PDF-');
      }
    }

    const svg = readFileSync(resolve(outputDirectory, 'divan-qr.svg'), 'utf8');
    expect(svg).toContain('width="70mm"');
    expect(svg).toContain('height="70mm"');
    expect(svg).not.toMatch(/<image|data:image|logo/iu);
  });

  test('keeps physical scan acceptance fail-closed after digital verification', () => {
    const result = spawnSync(
      tsx,
      [
        resolve(projectRoot, 'scripts/qr/verify-qr.ts'),
        '--pack',
        outputDirectory,
      ],
      { cwd: projectRoot, encoding: 'utf8' },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Digital QR pack: PASS');
    expect(result.stderr).toContain('Physical scan matrix: BLOCKED');
  });
});
