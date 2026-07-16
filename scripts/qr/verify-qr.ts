#!/usr/bin/env tsx
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const expectedArtefacts = [
  'divan-qr.svg',
  'divan-qr-monochrome-backup.svg',
  'a3-hero-poster.pdf',
  'a5-table-stand.pdf',
  'take-home-card.pdf',
  'staff-troubleshooting-card.pdf',
] as const;

interface Artefact {
  readonly file: string;
  readonly sha256: string;
}

function die(message: string): never {
  throw new Error(message);
}

function packPath(argv: ReadonlyArray<string>): string {
  const candidate = argv[1];
  if (
    argv.length !== 2 ||
    argv[0] !== '--pack' ||
    candidate === undefined ||
    candidate === ''
  ) {
    die('Usage: verify-qr.ts --pack <directory>');
  }
  const path = resolve(candidate);
  if (lstatSync(path).isSymbolicLink()) {
    die('The QR pack directory must not be a symbolic link.');
  }
  return path;
}

function digest(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArtefact(value: unknown): value is Artefact {
  return (
    isRecord(value) &&
    typeof value['file'] === 'string' &&
    typeof value['sha256'] === 'string'
  );
}

function verify(): void {
  const directory = packPath(process.argv.slice(2));
  const manifest: unknown = JSON.parse(
    readFileSync(resolve(directory, 'qr-manifest.json'), 'utf8'),
  );

  if (
    !isRecord(manifest) ||
    typeof manifest['destination'] !== 'string' ||
    new URL(manifest['destination']).protocol !== 'https:' ||
    manifest['errorCorrectionLevel'] !== 'M' ||
    manifest['quietZoneModules'] !== 4 ||
    manifest['redirectVerified'] !== false ||
    manifest['physicalScanMatrix'] !== 'BLOCKED'
  ) {
    die('The QR manifest does not match the reviewed release contract.');
  }
  const artefacts = manifest['artefacts'];
  if (
    !Array.isArray(artefacts) ||
    !artefacts.every(isArtefact) ||
    JSON.stringify(artefacts.map(({ file }) => file)) !==
      JSON.stringify(expectedArtefacts)
  ) {
    die('The QR manifest artefact inventory is not exact.');
  }

  for (const artefact of artefacts) {
    const path = resolve(directory, artefact.file);
    const bytes = readFileSync(path);
    if (digest(bytes) !== artefact.sha256) {
      die(`QR artefact checksum mismatch: ${artefact.file}`);
    }
    if (
      artefact.file.endsWith('.pdf') &&
      bytes.subarray(0, 5).toString() !== '%PDF-'
    ) {
      die(`QR print artefact is not a PDF: ${artefact.file}`);
    }
  }

  const svg = readFileSync(resolve(directory, 'divan-qr.svg'), 'utf8');
  if (
    !svg.includes('width="70mm"') ||
    !svg.includes('height="70mm"') ||
    /<image|data:image|logo/iu.test(svg)
  ) {
    die('The primary QR SVG is not the required logo-free 70 mm vector.');
  }

  console.error('Digital QR pack: PASS');
  console.error(
    'Physical scan matrix: BLOCKED — printed iOS/Android distance and lighting checks require human evidence.',
  );
  process.exitCode = 1;
}

try {
  verify();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Digital QR pack: FAIL — ${message}`);
  process.exitCode = 1;
}
