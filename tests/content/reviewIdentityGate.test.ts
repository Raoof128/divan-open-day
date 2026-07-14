import { describe, expect, it } from 'vitest';

import { approvalRegistrySchema } from '../../src/lib/content/registrySchemas';

/**
 * Packet v1 (2026-07-14) accepted eight pairings and recorded its `reviewer`
 * field as the empty string. An approval that names nobody is not an approval:
 * there is no one to have been wrong, and nothing to revoke.
 *
 * The identity requirement is already load-bearing in `approvalRecordSchema`.
 * These tests pin it against that concrete incident so it cannot be relaxed
 * quietly. See docs/audits/divan/2026-07-14-review-conflicts.md.
 */

const APPROVAL = {
  id: 'approval-rumi-0001',
  status: 'current' as const,
  item_id: 'rumi-0001',
  authoring_sha256: 'a'.repeat(64),
  approved_by: 'test-final-approver',
  approved_at: '2026-07-14',
};

const VALID = { schema_version: 1 as const, approvals: [APPROVAL] };

function withApprover(approvedBy: string): unknown {
  return {
    schema_version: 1,
    approvals: [{ ...APPROVAL, approved_by: approvedBy }],
  };
}

describe('human approval requires a named approver', () => {
  it('accepts an approval that names its approver', () => {
    expect(approvalRegistrySchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects the packet v1 shape: an empty reviewer identity', () => {
    expect(approvalRegistrySchema.safeParse(withApprover('')).success).toBe(
      false,
    );
  });

  it('rejects whitespace and placeholder identities', () => {
    // Not asserted here: a single-character identity ("a") is accepted. The
    // shared identifierSchema enforces lowercase kebab-case but no minimum
    // length, and it backs every registry ID, so tightening it for approvers
    // alone belongs in its own change rather than smuggled in here. The packet
    // v1 defect — an identity that is literally empty — is rejected above.
    for (const approvedBy of [
      ' ',
      '   ',
      '??',
      'UNKNOWN',
      'n/a',
      'Some Name',
    ]) {
      expect(
        approvalRegistrySchema.safeParse(withApprover(approvedBy)).success,
        `approved_by ${JSON.stringify(approvedBy)} must not be accepted`,
      ).toBe(false);
    }
  });

  it('rejects an approval with no approver field at all', () => {
    const withoutApprover: Record<string, unknown> = { ...APPROVAL };
    delete withoutApprover['approved_by'];

    expect(
      approvalRegistrySchema.safeParse({
        schema_version: 1,
        approvals: [withoutApprover],
      }).success,
    ).toBe(false);
  });
});
