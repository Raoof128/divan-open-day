/**
 * Orchestrates deterministic EPUB extraction for every EPUB source recorded in
 * the registry that has actually been acquired into raw/. Runs the stdlib Python
 * extractor per source and writes staging JSONL into extracted/. No-ops with a
 * clear notice when no raw sources are present (the default, pre-fetch state).
 *
 * The Bell OCR source (kind: text/pdf) is handled separately by extract-hafez-bell.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';

import { sourceRegistrySchema } from '../../src/lib/content/sourceRegistrySchema';

function main(): void {
  const root = process.cwd();
  const registryPath = resolve(root, 'sources-private/poetry/registry.yaml');
  const rawRoot = resolve(root, 'sources-private/poetry/raw');
  const extractedRoot = resolve(root, 'sources-private/poetry/extracted');
  const extractor = resolve(root, 'scripts/poetry/extract-epub.py');

  const registry = sourceRegistrySchema.parse(
    parseYaml(readFileSync(registryPath, 'utf8')),
  );

  const outputName: Record<string, string> = {
    'hafez-qazvini-ghani-fa-wikisource': 'hafez-fa.jsonl',
    'rumi-whinfield-abridged-en': 'rumi-whinfield-en.jsonl',
  };

  // The Persian Masnavi root export is only a section INDEX (titles, no verse):
  // its real couplets are fetched per-section by `poetry:fetch-masnavi`, which
  // owns rumi-fa.jsonl. Skip it here so the EPUB index never overwrites verse.
  const EPUB_INDEX_ONLY = new Set(['rumi-nicholson-fa-wikisource']);

  let extracted = 0;
  for (const source of registry.sources) {
    if (EPUB_INDEX_ONLY.has(source.id)) {
      process.stdout.write(
        `• ${source.id}: index-only EPUB — verse comes from \`pnpm poetry:fetch-masnavi\`; skipping.\n`,
      );
      continue;
    }
    const epubArtifact = source.download_artifacts.find(
      (artifact) => artifact.kind === 'epub',
    );
    if (!epubArtifact) {
      continue;
    }
    const input = resolve(rawRoot, source.id, 'source.epub');
    if (!existsSync(input)) {
      process.stdout.write(`• ${source.id}: not acquired yet — skipping.\n`);
      continue;
    }
    const output = resolve(
      extractedRoot,
      outputName[source.id] ?? `${source.id}.jsonl`,
    );
    execFileSync(
      'python3',
      [
        extractor,
        '--source-id',
        source.id,
        '--input',
        input,
        '--output',
        output,
      ],
      { stdio: 'inherit' },
    );
    extracted += 1;
  }

  if (extracted === 0) {
    process.stdout.write(
      'No EPUB sources acquired yet. Run `pnpm poetry:fetch` (owner-gated) first.\n',
    );
  } else {
    process.stdout.write(`\nExtracted ${String(extracted)} EPUB source(s).\n`);
  }
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  import.meta.url.startsWith('file:') &&
  resolve(invokedPath) === resolve(fileURLToPath(import.meta.url))
) {
  main();
}
