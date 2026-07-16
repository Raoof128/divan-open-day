import { describe, expect, it } from 'vitest';

import {
  assertMachineAuthorityCurrent,
  machineAuthorityDigests,
  reviewAuthoritySchema,
  type MachineAuthorityBinding,
} from '../../src/lib/content/reviewAuthority';

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);

function binding(): MachineAuthorityBinding {
  return {
    englishSourceId: 'hafez-bell-1897-en',
    englishSourceHash: SHA_A,
    englishReference: 'Poem I, page 71',
    persianSourceId: 'hafez-qazvini-ghani-fa-wikisource',
    persianSourceHash: SHA_B,
    persianReference: 'Ghazal 1',
    canonicalIdentity: 'hafez-qazvini-ghani-fa-wikisource:ghazal:1',
    englishLines: ['Arise, oh Cup-bearer, rise!', 'And give me the cup.'],
    persianLines: ['الا یا ایها الساقی', 'ادر کاسا و ناولها'],
    mapping: [
      { englishIndex: 0, persianIndices: [0] },
      { englishIndex: 1, persianIndices: [1] },
    ],
  };
}

function machineAuthority(sourceBinding = binding()) {
  const digests = machineAuthorityDigests(sourceBinding);
  return {
    kind: 'machine_alignment' as const,
    model: 'gpt-5.5-codex',
    methodVersion: 'source-bound-alignment-v1',
    englishSourceId: sourceBinding.englishSourceId,
    englishSourceHash: sourceBinding.englishSourceHash,
    persianSourceId: sourceBinding.persianSourceId,
    persianSourceHash: sourceBinding.persianSourceHash,
    canonicalIdentityHash:
      machineAuthorityDigests(sourceBinding).canonicalIdentityHash,
    englishSpanHash: digests.englishSpanHash,
    persianSpanHash: digests.persianSpanHash,
    mappingHash: digests.mappingHash,
    verdict: 'MACHINE_VERIFIED' as const,
    confidence: 0.98,
    disclosures: [],
    verifiedAt: '2026-07-16',
    rationale:
      'The two selected source spans share the cup-bearer command and cup image in the same sequence.',
  };
}

describe('review authority', () => {
  it('accepts machine authority without a teacher or contributor identity', () => {
    const sourceBinding = binding();
    const authority = reviewAuthoritySchema.parse(
      machineAuthority(sourceBinding),
    );

    expect(() =>
      assertMachineAuthorityCurrent(sourceBinding, authority, '2026-07-16'),
    ).not.toThrow();
    expect(JSON.stringify(authority)).not.toMatch(/teacher|contributor/iu);
  });

  it('accepts legacy human authority as the other explicit authority kind', () => {
    expect(() =>
      reviewAuthoritySchema.parse({
        kind: 'human',
        contributorIds: ['source-editor-1'],
        attestationHash: SHA_A,
      }),
    ).not.toThrow();
  });

  it('rejects a record with neither authority kind', () => {
    expect(() => reviewAuthoritySchema.parse({})).toThrow();
  });

  it.each([
    ['English source hash', { englishSourceHash: 'c'.repeat(64) }],
    ['Persian source hash', { persianSourceHash: 'd'.repeat(64) }],
    ['English source reference', { englishReference: 'Poem II, page 72' }],
    ['Persian source reference', { persianReference: 'Ghazal 2' }],
    ['English source ID', { englishSourceId: 'hafez-clarke-1891-en' }],
    ['Persian source ID', { persianSourceId: 'other-persian-edition' }],
    [
      'canonical Persian identity',
      { canonicalIdentity: 'hafez-qazvini-ghani-fa-wikisource:ghazal:2' },
    ],
    ['English selected span', { englishLines: ['Changed source span'] }],
    ['Persian selected span', { persianLines: ['مقطع منبع تغییر کرد'] }],
    ['line mapping', { mapping: [{ englishIndex: 0, persianIndices: [1] }] }],
  ])('invalidates authority after a %s change', (_label, change) => {
    const sourceBinding = binding();
    const authority = machineAuthority(sourceBinding);
    const changed = { ...sourceBinding, ...change };

    expect(() =>
      assertMachineAuthorityCurrent(changed, authority, '2026-07-16'),
    ).toThrow(/stale|hash|binding|reference|span|mapping/iu);
  });

  it('allows a corrected mapping once a fresh machine authority is issued', () => {
    const corrected: MachineAuthorityBinding = {
      ...binding(),
      mapping: [{ englishIndex: 0, persianIndices: [0, 1] }],
    };
    const authority = machineAuthority(corrected);

    expect(() =>
      assertMachineAuthorityCurrent(corrected, authority, '2026-07-16'),
    ).not.toThrow();
    expect(JSON.stringify(authority)).not.toMatch(/human.*reapproval/iu);
  });

  it('rejects EXCLUDED authority for production eligibility', () => {
    const sourceBinding = binding();
    const authority = {
      ...machineAuthority(sourceBinding),
      verdict: 'EXCLUDED' as const,
      confidence: 0.2,
      disclosures: ['Insufficient source correspondence.'],
    };

    expect(() =>
      assertMachineAuthorityCurrent(sourceBinding, authority, '2026-07-16'),
    ).toThrow(/excluded|eligible/iu);
  });
});
