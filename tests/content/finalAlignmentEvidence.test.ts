import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const EXPECTED_HAFEZ = [
  17, 19, 28, 34, 38, 43, 52, 56, 58, 62, 77, 86, 89, 91, 94, 119, 130, 135,
  136, 161, 173, 180, 209, 234, 242, 278, 337, 342, 350, 377, 412, 427, 452,
  465, 468, 489,
];

interface EvidenceRecord {
  readonly englishLines: readonly string[];
  readonly persianLines: readonly string[];
  readonly mapping: readonly {
    readonly englishIndex: number;
    readonly persianIndices: readonly number[];
  }[];
}

interface EvidenceReport {
  readonly counts: {
    readonly finalHafez: number;
    readonly finalRumi: number;
    readonly finalTotal: number;
  };
  readonly newHafez: readonly (EvidenceRecord & {
    readonly ghazalNumber: number;
  })[];
  readonly newRumi: readonly (EvidenceRecord & {
    readonly segmentId: string;
    readonly persianLineStart: number;
  })[];
}

function normalizePersian(value: string): string {
  return value.replace(/[^\u0600-\u06ff]+/gu, '');
}

async function loadEvidence(): Promise<EvidenceReport> {
  return JSON.parse(
    await readFile(
      path.join(
        process.cwd(),
        'docs/verification/2026-07-16-final-alignment-evidence.json',
      ),
      'utf8',
    ),
  ) as EvidenceReport;
}

function expectMappingsToResolve(record: EvidenceRecord): void {
  expect(record.mapping).toHaveLength(record.englishLines.length);
  expect(record.mapping.map((entry) => entry.englishIndex)).toEqual(
    record.englishLines.map((_, index) => index),
  );
  for (const entry of record.mapping) {
    expect(entry.persianIndices.length).toBeGreaterThan(0);
    for (const index of entry.persianIndices) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(record.persianLines.length);
    }
  }
}

describe('final alignment evidence', () => {
  it('locks the reviewed 60/60 source-bound expansion', async () => {
    const report = await loadEvidence();

    expect(report.counts).toEqual(
      expect.objectContaining({
        finalHafez: 60,
        finalRumi: 60,
        finalTotal: 120,
      }),
    );
    expect(
      report.newHafez
        .map((record) => record.ghazalNumber)
        .sort((a, b) => a - b),
    ).toEqual(EXPECTED_HAFEZ);
    expect(new Set(report.newRumi.map((record) => record.segmentId)).size).toBe(
      44,
    );
  });

  it('binds every selected source unit to an in-range Persian unit', async () => {
    const report = await loadEvidence();

    for (const record of [...report.newHafez, ...report.newRumi]) {
      expectMappingsToResolve(record);
    }
  });

  it('keeps Rumi Persian selections non-overlapping', async () => {
    const report = await loadEvidence();
    const selectedLines = report.newRumi.flatMap((record) =>
      record.persianLines.map(normalizePersian),
    );

    expect(new Set(selectedLines).size).toBe(selectedLines.length);
  });
});
