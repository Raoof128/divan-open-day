import { describe, expect, test } from 'vitest';

import {
  machineAlignmentRecordSchema,
  machineAlignmentRegistrySchema,
} from '../../src/lib/content/machineAlignmentSchema';

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const SHA_C = 'c'.repeat(64);

function anchor(index: number) {
  return {
    type: 'distinctive_image',
    english_evidence: `english evidence ${String(index)}`,
    persian_evidence: `persian evidence ${String(index)}`,
    explanation: `why these correspond ${String(index)}`,
  };
}

/** A verdict-`pass` record: the only shape the production gate may accept. */
function passRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'align-hafez-01',
    item_id: 'hafez-01',
    authoring_sha256: SHA_A,
    persian_source_id: 'hafez-qazvini-ghani-fa-wikisource',
    persian_snapshot_sha256: SHA_B,
    english_source_id: 'hafez-bell-1897-en',
    english_snapshot_sha256: SHA_C,
    verdict: 'pass',
    classification: 'faithful_poetic_translation',
    confidence: 'high',
    anchors: [anchor(1), anchor(2), anchor(3)],
    release_eligible: true,
    human_reapproval_required: false,
    blocking_reasons: [],
    reviewed_at: '2026-07-14',
    reviewed_by_model: 'claude-opus-4-8',
    ...overrides,
  };
}

describe('machine alignment record schema', () => {
  test('accepts a well-evidenced pass', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(passRecord()),
    ).not.toThrow();
  });

  test('accepts an abridged pass_with_disclosure at medium confidence', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({
          verdict: 'pass_with_disclosure',
          classification: 'abridged_correspondence',
          confidence: 'medium',
        }),
      ),
    ).not.toThrow();
  });

  test('accepts a blocked mismatch that carries a reason', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({
          verdict: 'blocked',
          classification: 'mismatch',
          confidence: 'low',
          anchors: [],
          release_eligible: false,
          blocking_reasons: ['English passage is a different ghazal.'],
        }),
      ),
    ).not.toThrow();
  });

  test('accepts needs_human_reapproval when the mapping was corrected', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({
          verdict: 'needs_human_reapproval',
          release_eligible: false,
          human_reapproval_required: true,
        }),
      ),
    ).not.toThrow();
  });

  test('rejects unknown verdicts and classifications', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(passRecord({ verdict: 'looks_fine' })),
    ).toThrow();
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({ classification: 'vibes_match' }),
      ),
    ).toThrow();
  });

  test('rejects unknown fields', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({ reviewer_real_name: 'A Person' }),
      ),
    ).toThrow();
  });

  // A pass is a claim that the passages correspond. It must be earned.
  test('rejects a pass below the independent-anchor minimum', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({ anchors: [anchor(1), anchor(2)] }),
      ),
    ).toThrow(/anchor/iu);
  });

  test('rejects a pass at medium or low confidence', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(passRecord({ confidence: 'medium' })),
    ).toThrow(/confidence/iu);
    expect(() =>
      machineAlignmentRecordSchema.parse(passRecord({ confidence: 'low' })),
    ).toThrow(/confidence/iu);
  });

  test('rejects low confidence that claims release eligibility', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({
          verdict: 'pass_with_disclosure',
          classification: 'partial_correspondence',
          confidence: 'low',
        }),
      ),
    ).toThrow(/confidence/iu);
  });

  // Semantic similarity is not correspondence.
  test('rejects a mismatch or insufficient evidence that is not blocked', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({ classification: 'mismatch' }),
      ),
    ).toThrow(/blocked/iu);
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({ classification: 'insufficient_evidence' }),
      ),
    ).toThrow(/blocked/iu);
  });

  // Non-contiguous composites cannot be shown as one continuous excerpt.
  test('rejects a composite that claims release eligibility', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({ classification: 'composite_correspondence' }),
      ),
    ).toThrow(/composite/iu);
  });

  test('rejects blocked records that claim release eligibility', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({
          verdict: 'blocked',
          classification: 'mismatch',
          confidence: 'low',
          anchors: [],
          blocking_reasons: ['no'],
          release_eligible: true,
        }),
      ),
    ).toThrow(/release/iu);
  });

  test('rejects blocked records with no stated reason', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({
          verdict: 'blocked',
          classification: 'mismatch',
          confidence: 'low',
          anchors: [],
          release_eligible: false,
          blocking_reasons: [],
        }),
      ),
    ).toThrow(/reason/iu);
  });

  test('rejects needs_human_reapproval that claims release eligibility', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({
          verdict: 'needs_human_reapproval',
          human_reapproval_required: true,
          release_eligible: true,
        }),
      ),
    ).toThrow(/release/iu);
  });

  test('rejects a pass that also demands human reapproval', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({ human_reapproval_required: true }),
      ),
    ).toThrow(/reapproval/iu);
  });

  test('rejects malformed digests', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({ authoring_sha256: 'not-a-digest' }),
      ),
    ).toThrow();
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({ persian_snapshot_sha256: SHA_A.slice(0, 40) }),
      ),
    ).toThrow();
  });

  // Evidence excerpts are private source material; keep them short.
  test('rejects oversized anchor evidence', () => {
    expect(() =>
      machineAlignmentRecordSchema.parse(
        passRecord({
          anchors: [
            { ...anchor(1), english_evidence: 'x'.repeat(400) },
            anchor(2),
            anchor(3),
          ],
        }),
      ),
    ).toThrow();
  });
});

describe('machine alignment registry schema', () => {
  test('accepts a registry of records', () => {
    expect(() =>
      machineAlignmentRegistrySchema.parse({
        schema_version: 1,
        alignments: [passRecord()],
      }),
    ).not.toThrow();
  });

  test('rejects two alignment records bound to the same item', () => {
    expect(() =>
      machineAlignmentRegistrySchema.parse({
        schema_version: 1,
        alignments: [passRecord(), passRecord({ id: 'align-hafez-01-again' })],
      }),
    ).toThrow(/item/iu);
  });

  test('rejects duplicate record IDs', () => {
    expect(() =>
      machineAlignmentRegistrySchema.parse({
        schema_version: 1,
        alignments: [passRecord(), passRecord({ item_id: 'hafez-02' })],
      }),
    ).toThrow(/duplicate/iu);
  });
});
