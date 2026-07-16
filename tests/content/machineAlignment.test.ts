import { describe, expect, it } from 'vitest';

import {
  MACHINE_AUTHORITY_VERDICTS,
  reviewAuthoritySchema,
} from '../../src/lib/content/reviewAuthority';

const SHA = 'a'.repeat(64);

function record(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'machine_alignment',
    model: 'gpt-5.5-codex',
    methodVersion: 'source-bound-alignment-v1',
    englishSourceId: 'hafez-bell-1897-en',
    englishSourceHash: SHA,
    persianSourceId: 'hafez-qazvini-ghani-fa-wikisource',
    persianSourceHash: SHA,
    canonicalIdentityHash: SHA,
    englishSpanHash: SHA,
    persianSpanHash: SHA,
    mappingHash: SHA,
    verdict: 'MACHINE_VERIFIED',
    confidence: 0.95,
    disclosures: [],
    verifiedAt: '2026-07-16',
    rationale:
      'Three distinctive images and their narrative order bind the selected source spans.',
    ...overrides,
  };
}

describe('machine alignment authority schema', () => {
  it('limits machine state to the three active verdicts', () => {
    expect(MACHINE_AUTHORITY_VERDICTS).toEqual([
      'MACHINE_VERIFIED',
      'MACHINE_VERIFIED_WITH_DISCLOSURE',
      'EXCLUDED',
    ]);
  });

  it('accepts verified and verified-with-disclosure records', () => {
    expect(() => reviewAuthoritySchema.parse(record())).not.toThrow();
    expect(() =>
      reviewAuthoritySchema.parse(
        record({
          verdict: 'MACHINE_VERIFIED_WITH_DISCLOSURE',
          disclosures: [
            'The English source abridges the continuous Persian span.',
          ],
        }),
      ),
    ).not.toThrow();
  });

  it('rejects disclosure verdicts without a disclosure', () => {
    expect(() =>
      reviewAuthoritySchema.parse(
        record({ verdict: 'MACHINE_VERIFIED_WITH_DISCLOSURE' }),
      ),
    ).toThrow(/disclosure/iu);
  });

  it('rejects unknown legacy workflow states and unknown identity fields', () => {
    expect(() =>
      reviewAuthoritySchema.parse(
        record({ verdict: 'needs_human_reapproval' }),
      ),
    ).toThrow();
    expect(() =>
      reviewAuthoritySchema.parse(record({ teacher_id: 'someone' })),
    ).toThrow();
  });
});
