#!/usr/bin/env tsx
import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const QUIET_ZONE_MODULES = 4;
const ERROR_CORRECTION_LEVEL = 'M';
const MM_TO_POINTS = 72 / 25.4;
const COPY = 'A verse is waiting for you…';

interface Options {
  readonly outputDirectory: string;
  readonly url: string;
}

interface QrMatrix {
  readonly data: Uint8Array;
  readonly size: number;
}

interface PdfSpec {
  readonly file: string;
  readonly pageHeightMm: number;
  readonly pageWidthMm: number;
  readonly qrSizeMm: number;
  readonly subtitle: string;
  readonly title: string;
}

const pdfSpecs: ReadonlyArray<PdfSpec> = [
  {
    file: 'a3-hero-poster.pdf',
    pageWidthMm: 297,
    pageHeightMm: 420,
    qrSizeMm: 180,
    title: 'DIVAN',
    subtitle: COPY,
  },
  {
    file: 'a5-table-stand.pdf',
    pageWidthMm: 148,
    pageHeightMm: 210,
    qrSizeMm: 70,
    title: 'DIVAN',
    subtitle: COPY,
  },
  {
    file: 'take-home-card.pdf',
    pageWidthMm: 85,
    pageHeightMm: 55,
    qrSizeMm: 35,
    title: 'DIVAN',
    subtitle: 'Scan to reveal a poem',
  },
  {
    file: 'staff-troubleshooting-card.pdf',
    pageWidthMm: 148,
    pageHeightMm: 210,
    qrSizeMm: 70,
    title: 'DIVAN staff check',
    subtitle: 'Confirm HTTPS, camera focus, and adequate light.',
  },
];

function die(message: string): never {
  throw new Error(message);
}

function parseArgs(argv: ReadonlyArray<string>): Options {
  let outputDirectory = '';
  let url = '';

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--url') {
      url = argv[index + 1] ?? '';
      index += 1;
    } else if (argument === '--output') {
      outputDirectory = argv[index + 1] ?? '';
      index += 1;
    } else {
      die('Usage: generate-qr.ts --url <https-url> --output <directory>');
    }
  }

  let destination: URL;
  try {
    destination = new URL(url);
  } catch {
    die('The QR destination must be a valid absolute URL.');
  }
  if (
    destination.protocol !== 'https:' ||
    destination.username !== '' ||
    destination.password !== '' ||
    destination.hash !== ''
  ) {
    die('The QR destination must be credential-free HTTPS without a fragment.');
  }
  if (outputDirectory === '') {
    die('--output is required.');
  }

  return { outputDirectory: resolve(outputDirectory), url };
}

function matrixFor(url: string): QrMatrix {
  const modules = QRCode.create(url, {
    errorCorrectionLevel: ERROR_CORRECTION_LEVEL,
  }).modules;
  return { data: modules.data, size: modules.size };
}

function isDark(matrix: QrMatrix, row: number, column: number): boolean {
  return matrix.data[row * matrix.size + column] === 1;
}

function renderSvg(matrix: QrMatrix): string {
  const dimension = matrix.size + QUIET_ZONE_MODULES * 2;
  const paths: string[] = [];
  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (isDark(matrix, row, column)) {
        paths.push(
          `M${column + QUIET_ZONE_MODULES} ${row + QUIET_ZONE_MODULES}h1v1h-1z`,
        );
      }
    }
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="70mm" height="70mm" viewBox="0 0 ${dimension} ${dimension}" role="img" aria-label="QR code for DIVAN">`,
    `<rect width="${dimension}" height="${dimension}" fill="#fff"/>`,
    `<path d="${paths.join('')}" fill="#111"/>`,
    '</svg>',
    '',
  ].join('\n');
}

function drawQr(
  document: PDFKit.PDFDocument,
  matrix: QrMatrix,
  x: number,
  y: number,
  size: number,
): void {
  const dimension = matrix.size + QUIET_ZONE_MODULES * 2;
  const moduleSize = size / dimension;
  document.save().fillColor('#ffffff').rect(x, y, size, size).fill();
  document.fillColor('#111111');
  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (isDark(matrix, row, column)) {
        document
          .rect(
            x + (column + QUIET_ZONE_MODULES) * moduleSize,
            y + (row + QUIET_ZONE_MODULES) * moduleSize,
            moduleSize + 0.01,
            moduleSize + 0.01,
          )
          .fill();
      }
    }
  }
  document.restore();
}

async function renderPdf(matrix: QrMatrix, spec: PdfSpec): Promise<Buffer> {
  const width = spec.pageWidthMm * MM_TO_POINTS;
  const height = spec.pageHeightMm * MM_TO_POINTS;
  const document = new PDFDocument({
    autoFirstPage: false,
    compress: true,
    info: {
      Author: 'Persian Society EOI',
      CreationDate: new Date('2026-07-16T00:00:00.000Z'),
      Creator: 'DIVAN QR generator',
      Title: spec.title,
    },
    margin: 0,
  });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((accept, reject) => {
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('error', reject);
    document.on('end', () => accept(Buffer.concat(chunks)));
  });

  document.addPage({ size: [width, height], margin: 0 });
  document.rect(0, 0, width, height).fill('#f7f2e8');

  if (spec.file === 'take-home-card.pdf') {
    document
      .fillColor('#111111')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(spec.title, 7 * MM_TO_POINTS, 9 * MM_TO_POINTS, {
        width: 34 * MM_TO_POINTS,
      });
    document
      .font('Helvetica')
      .fontSize(9)
      .text(spec.subtitle, 7 * MM_TO_POINTS, 23 * MM_TO_POINTS, {
        lineGap: 2,
        width: 34 * MM_TO_POINTS,
      });
    const cardQrSize = spec.qrSizeMm * MM_TO_POINTS;
    drawQr(
      document,
      matrix,
      45 * MM_TO_POINTS,
      (height - cardQrSize) / 2,
      cardQrSize,
    );
    document.end();
    return result;
  }

  document
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(Math.min(36, width / 7))
    .text(spec.title, 0, height * 0.08, { align: 'center', width });
  document
    .font('Helvetica')
    .fontSize(Math.min(18, width / 16))
    .text(spec.subtitle, width * 0.08, height * 0.18, {
      align: 'center',
      width: width * 0.84,
    });

  const qrSize = spec.qrSizeMm * MM_TO_POINTS;
  drawQr(document, matrix, (width - qrSize) / 2, height * 0.35, qrSize);
  document.end();
  return result;
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  mkdirSync(options.outputDirectory, { recursive: true, mode: 0o700 });
  if (lstatSync(options.outputDirectory).isSymbolicLink()) {
    die('The output directory must not be a symbolic link.');
  }

  const matrix = matrixFor(options.url);
  const svg = renderSvg(matrix);
  const primarySvg = 'divan-qr.svg';
  const backupSvg = 'divan-qr-monochrome-backup.svg';
  const artefactFiles = [
    primarySvg,
    backupSvg,
    ...pdfSpecs.map(({ file }) => file),
  ];

  writeFileSync(resolve(options.outputDirectory, primarySvg), svg, {
    mode: 0o600,
  });
  writeFileSync(resolve(options.outputDirectory, backupSvg), svg, {
    mode: 0o600,
  });
  for (const spec of pdfSpecs) {
    writeFileSync(
      resolve(options.outputDirectory, spec.file),
      await renderPdf(matrix, spec),
      { mode: 0o600 },
    );
  }

  const manifest = {
    destination: options.url,
    errorCorrectionLevel: ERROR_CORRECTION_LEVEL,
    quietZoneModules: QUIET_ZONE_MODULES,
    redirectVerified: false,
    physicalScanMatrix: 'BLOCKED',
    artefacts: artefactFiles.map((file) => ({
      file,
      sha256: sha256(resolve(options.outputDirectory, file)),
    })),
  };
  writeFileSync(
    resolve(options.outputDirectory, 'qr-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { mode: 0o600 },
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`QR generation failed: ${message}`);
  process.exitCode = 1;
});
