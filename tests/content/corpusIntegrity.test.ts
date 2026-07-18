import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { loadContentPrivate } from '../../scripts/content/loadContent';
import type { AuthoringContentItem } from '../../src/lib/content/authoringSchema';
import { sourceRightsEvidenceSchema } from '../../src/lib/content/sourceRightsSchema';

const PROJECT_ROOT = process.cwd();

/**
 * Corpus-integrity regressions for the defect classes repaired by the Fable 5
 * corpus campaign (docs/audits/corpus-fable-5/02-defect-ledger.md). Every check
 * reads only tracked inputs — the authored corpus, source-lock.json and
 * rights-evidence.yaml — so the whole suite runs in CI.
 *
 * These are content gates, not schema gates: each one encodes a way the
 * published corpus has actually been wrong (truncation brackets, footnote
 * digits shipped as verse, OCR vocative `0`, headings without windows,
 * provenance bound to an artifact the pipeline never read).
 */

interface LockEntry {
  readonly source_id: string;
  readonly artifact_kind: string;
  readonly sha256: string;
}

const lock = JSON.parse(
  readFileSync(
    path.join(PROJECT_ROOT, 'sources-private/poetry/source-lock.json'),
    'utf8',
  ),
) as { entries: LockEntry[] };
const lockHashes = new Set(lock.entries.map((entry) => entry.sha256));
const hashesFor = (sourceId: string, kind: string): Set<string> =>
  new Set(
    lock.entries
      .filter(
        (entry) => entry.source_id === sourceId && entry.artifact_kind === kind,
      )
      .map((entry) => entry.sha256),
  );

async function loadItems(): Promise<readonly AuthoringContentItem[]> {
  const loaded = await loadContentPrivate({
    projectRoot: PROJECT_ROOT,
    profile: 'production',
  });
  return loaded.items;
}

function allLines(item: AuthoringContentItem): readonly string[] {
  return [...item.text.persian_lines, ...item.text.english_lines];
}

describe('published verse integrity', () => {
  it('contains no truncation brackets in any published line', async () => {
    for (const item of await loadItems()) {
      for (const line of allLines(item)) {
        expect(line, `${item.id}: ${line}`).not.toMatch(/[[\]]/u);
      }
    }
  });

  it('contains no literal elision marks in any published line', async () => {
    for (const item of await loadItems()) {
      for (const line of allLines(item)) {
        expect(line, `${item.id}: ${line}`).not.toMatch(/(?:\.\.\.|…)/u);
      }
    }
  });

  it('contains no trailing footnote digits in any published line', async () => {
    for (const item of await loadItems()) {
      for (const line of allLines(item)) {
        expect(line, `${item.id}: ${line}`).not.toMatch(/\s\d{1,3}\s*$/u);
      }
    }
  });

  it('contains no known OCR corruption patterns in English lines', async () => {
    for (const item of await loadItems()) {
      for (const line of item.text.english_lines) {
        expect(line, `${item.id}: ${line}`).not.toMatch(/\bIii\b/u);
        expect(line, `${item.id}: ${line}`).not.toMatch(/\bO them\b/u);
        // Digit zero used as the vocative letter O.
        expect(line, `${item.id}: ${line}`).not.toMatch(/(?:^|[\s(])0\s/u);
      }
    }
  });

  it('contains no unnormalised small-cap drop-cap openings', async () => {
    for (const item of await loadItems()) {
      for (const line of item.text.english_lines) {
        expect(line, `${item.id}: ${line}`).not.toMatch(/^[A-Z]{2,}[a-z ]/u);
      }
    }
  });

  it('keeps straight double quotes balanced within every record', async () => {
    for (const item of await loadItems()) {
      const quoteCount =
        item.text.english_lines.join('\n').split('"').length - 1;
      expect(quoteCount % 2, `${item.id} has an unbalanced quotation`).toBe(0);
    }
  });
});

describe('source references and windows', () => {
  it('gives every Rumi record an explicit English line window', async () => {
    for (const item of await loadItems()) {
      if (item.poet !== 'rumi') {
        continue;
      }
      expect(
        item.source.english_source_reference,
        `${item.id} lacks a :lines-N-M window`,
      ).toMatch(/:lines-\d+-\d+$/u);
    }
  });

  it('cites every Bell poem with a valid Roman numeral, exactly once', async () => {
    const seen = new Map<string, string>();
    for (const item of await loadItems()) {
      if (item.source.english_source_id !== 'hafez-bell-1897-en') {
        continue;
      }
      const reference = item.source.english_source_reference;
      expect(reference, item.id).toMatch(
        /^Bell poem [IVXLC]+, scan page \d+$/u,
      );
      const firstSeenBy = seen.get(reference);
      expect(
        firstSeenBy,
        `${item.id} and ${firstSeenBy ?? ''} cite the same Bell poem`,
      ).toBeUndefined();
      seen.set(reference, item.id);
    }
  });

  it('publishes the full opening couplet for every Hafez record', async () => {
    for (const item of await loadItems()) {
      if (item.poet !== 'hafez') {
        continue;
      }
      expect(
        item.text.persian_lines.length,
        `${item.id} publishes a lone hemistich`,
      ).toBeGreaterThanOrEqual(2);
      const mappedPersian = new Set(
        item.text.mapping.flatMap((entry) => entry.persian_indices),
      );
      for (
        let persianIndex = 0;
        persianIndex < item.text.persian_lines.length;
        persianIndex += 1
      ) {
        expect(
          mappedPersian.has(persianIndex),
          `${item.id} leaves Persian line ${String(persianIndex)} unmapped`,
        ).toBe(true);
      }
    }
  });
});

describe('provenance binding', () => {
  it('binds every record to hashes that exist in the source lock', async () => {
    for (const item of await loadItems()) {
      expect(
        lockHashes.has(item.source.english_source_sha256),
        `${item.id} English hash is not a locked artifact`,
      ).toBe(true);
      expect(
        lockHashes.has(item.source.persian_source_sha256),
        `${item.id} Persian hash is not a locked artifact`,
      ).toBe(true);
    }
  });

  it('binds Clarke records to the transcript artifacts their text came from', async () => {
    const clarkeTextHashes = hashesFor('hafez-clarke-1891-en', 'text');
    expect(clarkeTextHashes.size).toBe(2);
    for (const item of await loadItems()) {
      if (item.source.english_source_id !== 'hafez-clarke-1891-en') {
        continue;
      }
      expect(
        clarkeTextHashes.has(item.source.english_source_sha256),
        `${item.id} binds an artifact the pipeline did not read`,
      ).toBe(true);
    }
  });

  it('binds Persian sides to the respective locked EPUB snapshots', async () => {
    const hafezEpub = hashesFor('hafez-qazvini-ghani-fa-wikisource', 'epub');
    const rumiEpub = hashesFor('rumi-nicholson-fa-wikisource', 'epub');
    for (const item of await loadItems()) {
      const expected = item.poet === 'hafez' ? hafezEpub : rumiEpub;
      expect(
        expected.has(item.source.persian_source_sha256),
        `${item.id} Persian hash does not match its edition snapshot`,
      ).toBe(true);
    }
  });
});

describe('rights-evidence coupling', () => {
  it('couples every rights record to an acquired locked artifact', () => {
    const evidence = sourceRightsEvidenceSchema.parse(
      parse(
        readFileSync(
          path.join(
            PROJECT_ROOT,
            'sources-private/poetry/rights-evidence.yaml',
          ),
          'utf8',
        ),
      ),
    );
    expect(evidence.records.length).toBe(5);
    for (const record of evidence.records) {
      expect(
        record.source_lock_reference,
        `${record.source_id} has no acquired source-lock coupling`,
      ).not.toBeNull();
      expect(
        record.source_lock_reference !== null &&
          lockHashes.has(record.source_lock_reference),
        `${record.source_id} lock reference does not resolve`,
      ).toBe(true);
    }
  });
});
