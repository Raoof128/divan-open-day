import { z } from 'zod';

import { canonicalSha256 } from './canonical';

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

const identifierSchema = z.string().min(1).max(128).regex(IDENTIFIER_PATTERN);
const sha256Schema = z.string().regex(SHA256_PATTERN);
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, 'Verification date must be a real ISO calendar date.');

const humanAuthoritySchema = z
  .object({
    kind: z.literal('human'),
    contributorIds: z.array(identifierSchema).min(1).max(20),
    attestationHash: sha256Schema,
  })
  .strict();

export const MACHINE_AUTHORITY_VERDICTS = [
  'MACHINE_VERIFIED',
  'MACHINE_VERIFIED_WITH_DISCLOSURE',
  'EXCLUDED',
] as const;

const machineAuthoritySchema = z
  .object({
    kind: z.literal('machine_alignment'),
    model: z.string().min(3).max(120),
    methodVersion: z.string().min(3).max(120),
    englishSourceId: identifierSchema,
    englishSourceHash: sha256Schema,
    persianSourceId: identifierSchema,
    persianSourceHash: sha256Schema,
    canonicalIdentityHash: sha256Schema,
    englishSpanHash: sha256Schema,
    persianSpanHash: sha256Schema,
    mappingHash: sha256Schema,
    verdict: z.enum(MACHINE_AUTHORITY_VERDICTS),
    confidence: z.number().finite().min(0).max(1),
    disclosures: z.array(z.string().min(3).max(1_200)).max(20),
    verifiedAt: isoDateSchema,
    rationale: z.string().min(20).max(2_000),
  })
  .strict()
  .superRefine((authority, context) => {
    if (
      authority.verdict === 'MACHINE_VERIFIED_WITH_DISCLOSURE' &&
      authority.disclosures.length === 0
    ) {
      context.addIssue({
        code: 'custom',
        path: ['disclosures'],
        message: 'A disclosure verdict must include a public disclosure.',
      });
    }

    if (
      authority.verdict === 'MACHINE_VERIFIED' &&
      authority.disclosures.length > 0
    ) {
      context.addIssue({
        code: 'custom',
        path: ['disclosures'],
        message: 'Use MACHINE_VERIFIED_WITH_DISCLOSURE when disclosures exist.',
      });
    }
  });

export const reviewAuthoritySchema = z.discriminatedUnion('kind', [
  humanAuthoritySchema,
  machineAuthoritySchema,
]);

export interface MachineLineMapping {
  readonly englishIndex: number;
  readonly persianIndices: readonly number[];
}

export interface MachineAuthorityBinding {
  readonly englishSourceId: string;
  readonly englishSourceHash: string;
  readonly englishReference: string;
  readonly persianSourceId: string;
  readonly persianSourceHash: string;
  readonly persianReference: string;
  readonly canonicalIdentity: string;
  readonly englishLines: readonly string[];
  readonly persianLines: readonly string[];
  readonly mapping: readonly MachineLineMapping[];
}

export interface MachineAuthorityDigests {
  readonly canonicalIdentityHash: string;
  readonly englishSpanHash: string;
  readonly persianSpanHash: string;
  readonly mappingHash: string;
}

export type ReviewAuthority = z.infer<typeof reviewAuthoritySchema>;
export type MachineReviewAuthority = z.infer<typeof machineAuthoritySchema>;

/**
 * Hash only the selected spans and their source coordinates. Full source books
 * remain private; the release gate needs their snapshot hashes, not their bytes.
 */
export function machineAuthorityDigests(
  binding: MachineAuthorityBinding,
): MachineAuthorityDigests {
  return {
    canonicalIdentityHash: canonicalSha256(binding.canonicalIdentity),
    englishSpanHash: canonicalSha256(binding.englishLines),
    persianSpanHash: canonicalSha256(binding.persianLines),
    mappingHash: canonicalSha256({
      englishSourceId: binding.englishSourceId,
      englishReference: binding.englishReference,
      mapping: binding.mapping,
      persianReference: binding.persianReference,
      persianSourceId: binding.persianSourceId,
    }),
  };
}

/**
 * Fail closed when any source snapshot, selected span, reference, or mapping has
 * changed since the machine verdict was issued.
 */
export function assertMachineAuthorityCurrent(
  binding: MachineAuthorityBinding,
  authorityInput: ReviewAuthority,
  buildDate: string,
): void {
  if (authorityInput.kind !== 'machine_alignment') {
    throw new Error(
      'Production eligibility requires machine alignment authority.',
    );
  }

  const authority = machineAuthoritySchema.parse(authorityInput);
  if (authority.verdict === 'EXCLUDED') {
    throw new Error('EXCLUDED machine authority is not production eligible.');
  }

  if (authority.verifiedAt > buildDate) {
    throw new Error('Machine authority is future-effective.');
  }

  if (
    authority.englishSourceId !== binding.englishSourceId ||
    authority.persianSourceId !== binding.persianSourceId
  ) {
    throw new Error('Machine authority has a stale source ID binding.');
  }

  if (
    authority.englishSourceHash !== binding.englishSourceHash ||
    authority.persianSourceHash !== binding.persianSourceHash
  ) {
    throw new Error('Machine authority has a stale source hash binding.');
  }

  const current = machineAuthorityDigests(binding);
  if (authority.canonicalIdentityHash !== current.canonicalIdentityHash) {
    throw new Error(
      'Machine authority has a stale canonical Persian identity binding.',
    );
  }
  if (authority.englishSpanHash !== current.englishSpanHash) {
    throw new Error(
      'Machine authority has a stale English selected-span hash.',
    );
  }
  if (authority.persianSpanHash !== current.persianSpanHash) {
    throw new Error(
      'Machine authority has a stale Persian selected-span hash.',
    );
  }
  if (authority.mappingHash !== current.mappingHash) {
    throw new Error(
      'Machine authority has a stale source-reference or mapping hash.',
    );
  }
}
