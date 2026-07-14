import { z } from 'zod';

/**
 * Machine alignment verification.
 *
 * The compiler already proves that a human approved an authoring item, and binds
 * that approval to the item's canonical SHA-256. It does not prove that anybody
 * checked whether the English excerpt is actually a translation of the Persian
 * excerpt it is paired with. A final approver can sign a mispaired record and it
 * will compile.
 *
 * This schema is that missing evidence: an independent, machine-produced record
 * asserting that a specific pairing was verified against its specific sources,
 * with the anchors that justify the verdict.
 *
 * It does not replace human approval, and human approval does not replace it.
 * Production requires both. A machine record carries no reviewer identity.
 */

const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const identifierSchema = z.string().min(3).max(120).regex(IDENTIFIER_PATTERN);
const sha256Schema = z.string().regex(SHA256_PATTERN);
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u);

export const ALIGNMENT_VERDICTS = [
  'pass',
  'pass_with_disclosure',
  'needs_human_reapproval',
  'blocked',
] as const;

export const ALIGNMENT_CLASSIFICATIONS = [
  'exact_correspondence',
  'faithful_poetic_translation',
  'partial_correspondence',
  'reordered_correspondence',
  'abridged_correspondence',
  'composite_correspondence',
  'mismatch',
  'insufficient_evidence',
] as const;

export const ALIGNMENT_CONFIDENCES = ['high', 'medium', 'low'] as const;

export const ALIGNMENT_ANCHOR_TYPES = [
  'distinctive_image',
  'named_figure',
  'rare_object',
  'unusual_action',
  'distinctive_contrast',
  'narrative_event_order',
  'refrain',
  'unique_story_context',
  'philosophical_proposition',
  'boundary_context',
] as const;

/**
 * A pass asserts the passages are the same underlying poem. Three independent
 * anchors is the floor: one or two shared generic ideas ("love", "heart",
 * "wine") is what a keyword scorer already produces, and it is not evidence.
 */
export const MIN_PASS_ANCHORS = 3;

/** Classifications meaning "the same underlying passage, translated". */
const CORRESPONDING_CLASSIFICATIONS = new Set<string>([
  'exact_correspondence',
  'faithful_poetic_translation',
  'partial_correspondence',
  'reordered_correspondence',
  'abridged_correspondence',
]);

/** Classifications that assert the pairing is wrong or unproven. */
const NON_CORRESPONDING_CLASSIFICATIONS = new Set<string>([
  'mismatch',
  'insufficient_evidence',
]);

/** Verdicts that may reach the public corpus. */
const RELEASABLE_VERDICTS = new Set<string>(['pass', 'pass_with_disclosure']);

const anchorSchema = z
  .object({
    type: z.enum(ALIGNMENT_ANCHOR_TYPES),
    // Evidence excerpts are private source material. Keep them to a citation,
    // not a passage: enough to justify the anchor, never enough to be a copy.
    english_evidence: z.string().min(3).max(240),
    persian_evidence: z.string().min(1).max(240),
    explanation: z.string().min(3).max(400),
  })
  .strict();

export const machineAlignmentRecordSchema = z
  .object({
    id: identifierSchema,
    /** The authoring item this verdict is about. */
    item_id: identifierSchema,
    /** Binds the verdict to exact canonical content; stale if the item changes. */
    authoring_sha256: sha256Schema,

    persian_source_id: identifierSchema,
    persian_snapshot_sha256: sha256Schema,
    english_source_id: identifierSchema,
    english_snapshot_sha256: sha256Schema,

    verdict: z.enum(ALIGNMENT_VERDICTS),
    classification: z.enum(ALIGNMENT_CLASSIFICATIONS),
    confidence: z.enum(ALIGNMENT_CONFIDENCES),
    anchors: z.array(anchorSchema).max(20),

    release_eligible: z.boolean(),
    human_reapproval_required: z.boolean(),
    blocking_reasons: z.array(z.string().min(3).max(400)).max(20),

    reviewed_at: isoDateSchema,
    reviewed_by_model: z.string().min(3).max(120),
  })
  .strict()
  .superRefine((record, ctx) => {
    const releasable = RELEASABLE_VERDICTS.has(record.verdict);

    // A verdict that cannot ship must never claim it can, and vice versa.
    if (record.release_eligible !== releasable) {
      ctx.addIssue({
        code: 'custom',
        path: ['release_eligible'],
        message: `Verdict ${record.verdict} is inconsistent with release_eligible ${String(record.release_eligible)}.`,
      });
    }

    if (record.release_eligible && record.human_reapproval_required) {
      ctx.addIssue({
        code: 'custom',
        path: ['human_reapproval_required'],
        message:
          'A record requiring human reapproval is not release eligible until a new human approval exists.',
      });
    }

    if (record.verdict === 'needs_human_reapproval') {
      if (!record.human_reapproval_required) {
        ctx.addIssue({
          code: 'custom',
          path: ['human_reapproval_required'],
          message:
            'Verdict needs_human_reapproval must set human_reapproval_required.',
        });
      }
    }

    if (record.verdict === 'blocked' && record.blocking_reasons.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['blocking_reasons'],
        message: 'A blocked record must state at least one blocking reason.',
      });
    }

    if (releasable && record.blocking_reasons.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['blocking_reasons'],
        message: `Verdict ${record.verdict} cannot carry blocking reasons.`,
      });
    }

    // Confidence is a triage signal, not proof — but low confidence can never
    // ship, and an unqualified pass demands the top of the scale.
    if (record.verdict === 'pass' && record.confidence !== 'high') {
      ctx.addIssue({
        code: 'custom',
        path: ['confidence'],
        message: 'Verdict pass requires high confidence.',
      });
    }

    if (releasable && record.confidence === 'low') {
      ctx.addIssue({
        code: 'custom',
        path: ['confidence'],
        message: 'Low confidence is never release eligible.',
      });
    }

    // A releasable verdict must actually claim correspondence.
    if (
      releasable &&
      NON_CORRESPONDING_CLASSIFICATIONS.has(record.classification)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['classification'],
        message: `Classification ${record.classification} must be blocked, not released.`,
      });
    }

    // Whinfield and Bell both draw on non-contiguous material. The public model
    // shows one continuous excerpt, so a composite cannot be shown honestly.
    if (releasable && record.classification === 'composite_correspondence') {
      ctx.addIssue({
        code: 'custom',
        path: ['classification'],
        message:
          'A composite_correspondence spans non-contiguous source regions and cannot be released as one excerpt; block it or require human reapproval.',
      });
    }

    // An exact_correspondence claim is stronger than a disclosure verdict.
    if (
      record.verdict === 'pass_with_disclosure' &&
      record.classification === 'exact_correspondence'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['classification'],
        message: 'exact_correspondence needs no disclosure; use verdict pass.',
      });
    }

    if (releasable && record.anchors.length < MIN_PASS_ANCHORS) {
      ctx.addIssue({
        code: 'custom',
        path: ['anchors'],
        message: `Verdict ${record.verdict} requires at least ${String(MIN_PASS_ANCHORS)} independent anchors; received ${String(record.anchors.length)}.`,
      });
    }

    if (
      releasable &&
      !CORRESPONDING_CLASSIFICATIONS.has(record.classification)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['classification'],
        message: `Classification ${record.classification} does not assert correspondence and cannot be released.`,
      });
    }
  });

export const machineAlignmentRegistrySchema = z
  .object({
    schema_version: z.literal(1),
    alignments: z.array(machineAlignmentRecordSchema),
  })
  .strict()
  .superRefine((registry, ctx) => {
    const seenIds = new Set<string>();
    const seenItemIds = new Set<string>();

    for (const record of registry.alignments) {
      if (seenIds.has(record.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['alignments'],
          message: `Duplicate machine alignment record ID ${record.id}.`,
        });
      }
      seenIds.add(record.id);

      // One verdict per item: two records would let a build pick the kinder one.
      if (seenItemIds.has(record.item_id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['alignments'],
          message: `More than one machine alignment record is bound to item ${record.item_id}.`,
        });
      }
      seenItemIds.add(record.item_id);
    }
  });

export type MachineAlignmentRecord = z.infer<
  typeof machineAlignmentRecordSchema
>;
export type MachineAlignmentRegistry = z.infer<
  typeof machineAlignmentRegistrySchema
>;
