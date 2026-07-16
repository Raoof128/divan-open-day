import { describe, expect, it } from 'vitest';

import { productionSelectionManifestSchema } from '../../src/lib/content/productionManifest';

const SHA = 'a'.repeat(64);

function record(poet: 'hafez' | 'rumi', index: number) {
  return {
    item_id: `${poet}-record-${String(index + 1).padStart(3, '0')}`,
    poet,
    canonical_identity_hash: SHA,
    english_span_hash: SHA,
    persian_span_hash: SHA,
    mapping_hash: SHA,
  };
}

function manifest() {
  return {
    schema_version: 1,
    records: [
      ...Array.from({ length: 60 }, (_, index) => record('hafez', index)),
      ...Array.from({ length: 60 }, (_, index) => record('rumi', index)),
    ],
  };
}

describe('production selection manifest schema', () => {
  it('accepts exactly 60 deterministically ordered IDs per poet', () => {
    expect(() =>
      productionSelectionManifestSchema.parse(manifest()),
    ).not.toThrow();
  });

  it('rejects duplicate IDs even when the manifest still totals 120', () => {
    const input = manifest();
    input.records[119] = { ...input.records[118]! };
    expect(() => productionSelectionManifestSchema.parse(input)).toThrow(
      /duplicate/iu,
    );
  });

  it('rejects a count-only 120-entry manifest with the wrong poet split', () => {
    const input = manifest();
    input.records[59] = record('rumi', 60);
    expect(() => productionSelectionManifestSchema.parse(input)).toThrow(
      /60 Hafez|60 Rumi/iu,
    );
  });

  it('rejects nondeterministic record ordering', () => {
    const input = manifest();
    [input.records[0], input.records[1]] = [
      input.records[1]!,
      input.records[0]!,
    ];
    expect(() => productionSelectionManifestSchema.parse(input)).toThrow(
      /order/iu,
    );
  });
});
