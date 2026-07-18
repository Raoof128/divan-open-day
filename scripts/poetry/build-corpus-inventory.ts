import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AuthoringContentItem } from '../../src/lib/content/authoringSchema';
import { canonicalSha256 } from '../../src/lib/content/canonical';
import { canonicalPersianIdentity } from '../../src/lib/content/canonicalIdentity';
import { RUMI_ARCHIVED_SELECTION } from '../../src/lib/content/productionSelection';
import {
  assertMachineAuthorityCurrent,
  machineAuthorityDigests,
} from '../../src/lib/content/reviewAuthority';
import { loadContentPrivate } from '../content/loadContent';
import {
  classifyEnglishBlocks,
  type EnglishSourceBlock,
} from './classify-english-blocks';

export interface BuildCorpusInventoryInput {
  readonly items: readonly AuthoringContentItem[];
  readonly buildDate: string;
  readonly targetPerPoet: number;
}

export interface CorpusInventoryRecord {
  readonly stableRecordId: string;
  readonly poet: AuthoringContentItem['poet'];
  readonly status: 'production' | 'archived' | 'excluded';
  readonly canonicalPersianIdentity: string;
  readonly englishSourceId: string;
  readonly englishLocation: string;
  readonly englishSpanHash: string;
  readonly persianSourceId: string;
  readonly persianLocation: string;
  readonly persianSpanHash: string;
  readonly englishSourceHash: string;
  readonly persianSourceHash: string;
  readonly mappingHash: string;
  readonly currentAuthorityKind: AuthoringContentItem['review_authority']['kind'];
  readonly sourceEvidenceCurrent: boolean;
  readonly finalContractAuthorityCurrent: boolean;
  readonly duplicateGroupId: string | null;
  readonly productionEligible: boolean;
  readonly failureReasons: readonly string[];
}

export interface CorpusInventory {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly targetPerPoet: number;
  readonly records: readonly CorpusInventoryRecord[];
  readonly candidates: readonly CandidateInventoryRecord[];
  readonly summary: {
    readonly validUniqueHafezCount: number;
    readonly validUniqueRumiCount: number;
    readonly finalContractStaleAuthorityCount: number;
    readonly duplicateHafezGhazalCount: number;
    readonly overlappingRumiSpanCount: number;
    readonly excludedCount: number;
    readonly remainingHafezRequired: number;
    readonly remainingRumiRequired: number;
  };
}

export interface CandidateInventoryRecord {
  readonly stableRecordId: string;
  readonly poet: AuthoringContentItem['poet'];
  readonly status: 'candidate' | 'verified' | 'archived' | 'excluded';
  readonly canonicalPersianIdentity: string | null;
  readonly englishSourceId: string;
  readonly englishLocation: string;
  readonly englishSpanHash: string;
  readonly persianSourceId: string;
  readonly persianLocation: string | null;
  readonly persianSpanHash: string | null;
  readonly englishSourceHash: string;
  readonly persianSourceHash: string;
  readonly mappingHash: string | null;
  readonly currentAuthorityKind: 'none';
  readonly sourceEvidenceCurrent: boolean;
  readonly finalContractAuthorityCurrent: false;
  readonly duplicateGroupId: string | null;
  readonly productionEligible: false;
  readonly failureReasons: readonly string[];
}

interface SourceLockEntry {
  readonly source_id: string;
  readonly artifact_kind: string;
  readonly file: string;
  readonly sha256: string;
}

interface HafezTask {
  readonly id: string;
  readonly volume: 'volume-1' | 'volume-2';
  readonly page: number;
  readonly matla: string;
  readonly odeLabelIsAmbiguous: boolean;
}

interface HafezProposal {
  readonly taskId: string;
  readonly ghazalNumber: number;
  readonly confidence: 'high' | 'medium';
  readonly anchors: readonly {
    readonly english: string;
    readonly persian: string;
    readonly note: string;
  }[];
}

interface HafezGhazal {
  readonly ghazalNumber: number;
  readonly hemistichs: readonly string[];
}

interface RumiCandidateUnit {
  readonly segmentId: string;
  readonly candidates: readonly {
    readonly persianSequence: number;
    readonly persianSha256: string;
  }[];
}

interface RumiAlignment {
  readonly segmentId: string;
  readonly persianSequence: number;
  readonly anchors?: readonly {
    readonly english?: string;
    readonly persian?: string;
  }[];
}

async function readJson<T>(filePath: string): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch (error) {
    throw new Error(`Unable to read inventory source ${filePath}.`, {
      cause: error,
    });
  }
}

async function readJsonLines<T>(filePath: string): Promise<T[]> {
  try {
    return (await readFile(filePath, 'utf8'))
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  } catch (error) {
    throw new Error(`Unable to read inventory source ${filePath}.`, {
      cause: error,
    });
  }
}

function requireSourceHash(
  entries: readonly SourceLockEntry[],
  sourceId: string,
  fileSuffix: string,
): string {
  const entry = entries.find(
    (candidate) =>
      candidate.source_id === sourceId && candidate.file.endsWith(fileSuffix),
  );
  if (entry === undefined) {
    throw new Error(
      `Candidate inventory is missing source-lock evidence for ${sourceId} ${fileSuffix}.`,
    );
  }
  return entry.sha256;
}

export async function loadCandidateInventory(
  projectRoot: string,
): Promise<readonly CandidateInventoryRecord[]> {
  const poetryRoot = path.join(projectRoot, 'sources-private/poetry');
  const reportsRoot = path.join(poetryRoot, 'reports');
  const extractedRoot = path.join(poetryRoot, 'extracted');
  const [
    lock,
    taskReport,
    proposalReport,
    ghazals,
    rumiCandidateReport,
    rumiAlignmentReport,
    englishRows,
  ] = await Promise.all([
    readJson<{ readonly entries: readonly SourceLockEntry[] }>(
      path.join(poetryRoot, 'source-lock.json'),
    ),
    readJson<{ readonly tasks: readonly HafezTask[] }>(
      path.join(reportsRoot, 'hafez-align-tasks.json'),
    ),
    readJson<{ readonly proposals: readonly HafezProposal[] }>(
      path.join(reportsRoot, 'hafez-clarke-align-proposals-UNVERIFIED.json'),
    ),
    readJsonLines<HafezGhazal>(
      path.join(extractedRoot, 'hafez-ghazals-fa.jsonl'),
    ),
    readJson<{ readonly units: readonly RumiCandidateUnit[] }>(
      path.join(reportsRoot, 'rumi-verse-candidates.json'),
    ),
    readJson<{
      readonly verified: readonly RumiAlignment[];
      readonly refuted: readonly RumiAlignment[];
      readonly insufficientVotes: readonly RumiAlignment[];
    }>(path.join(reportsRoot, 'rumi-alignment-candidates.json')),
    readJsonLines<EnglishSourceBlock>(
      path.join(extractedRoot, 'rumi-whinfield-en.jsonl'),
    ),
  ]);

  const proposalByTask = new Map(
    proposalReport.proposals.map((proposal) => [proposal.taskId, proposal]),
  );
  const ghazalByNumber = new Map(
    ghazals.map((ghazal) => [ghazal.ghazalNumber, ghazal]),
  );
  const hafezIdentityCounts = new Map<number, number>();
  for (const proposal of proposalReport.proposals) {
    hafezIdentityCounts.set(
      proposal.ghazalNumber,
      (hafezIdentityCounts.get(proposal.ghazalNumber) ?? 0) + 1,
    );
  }
  const hafezPersianHash = requireSourceHash(
    lock.entries,
    'hafez-qazvini-ghani-fa-wikisource',
    '/source.epub',
  );
  const hafezCandidates = taskReport.tasks.map(
    (task): CandidateInventoryRecord => {
      const proposal = proposalByTask.get(task.id);
      const ghazal =
        proposal === undefined
          ? undefined
          : ghazalByNumber.get(proposal.ghazalNumber);
      const persianSpanHash =
        ghazal === undefined
          ? null
          : canonicalSha256(ghazal.hemistichs.slice(0, 2));
      const duplicateGroupId =
        proposal !== undefined &&
        (hafezIdentityCounts.get(proposal.ghazalNumber) ?? 0) > 1
          ? `hafez-ghazal-${String(proposal.ghazalNumber)}`
          : null;
      const failureReasons = [
        proposal === undefined
          ? 'No canonical ghazal proposal exists for this candidate.'
          : 'Single-pass proposal has not received fresh final-contract machine authority.',
      ];
      if (task.odeLabelIsAmbiguous) {
        failureReasons.push(
          'The printed ode label is ambiguous; volume and page remain the stable English identity.',
        );
      }
      return {
        stableRecordId: `hafez-candidate-${task.volume}-p${String(task.page)}`,
        poet: 'hafez',
        status: 'candidate',
        canonicalPersianIdentity:
          proposal === undefined
            ? null
            : `hafez-qazvini-ghani-fa-wikisource:ghazal-${String(proposal.ghazalNumber)}`,
        englishSourceId: 'hafez-clarke-1891-en',
        englishLocation: task.id,
        englishSpanHash: canonicalSha256(task.matla),
        persianSourceId: 'hafez-qazvini-ghani-fa-wikisource',
        persianLocation:
          proposal === undefined
            ? null
            : `ghazal:${String(proposal.ghazalNumber)}`,
        persianSpanHash,
        englishSourceHash: requireSourceHash(
          lock.entries,
          'hafez-clarke-1891-en',
          `/${task.volume}.txt`,
        ),
        persianSourceHash: hafezPersianHash,
        mappingHash:
          proposal === undefined
            ? null
            : canonicalSha256({
                englishLocation: task.id,
                persianLocation: `ghazal:${String(proposal.ghazalNumber)}`,
                anchors: proposal.anchors,
              }),
        currentAuthorityKind: 'none',
        sourceEvidenceCurrent:
          task.matla.trim().length > 0 &&
          (proposal === undefined || ghazal !== undefined),
        finalContractAuthorityCurrent: false,
        duplicateGroupId,
        productionEligible: false,
        failureReasons,
      };
    },
  );

  const classifiedSegments = new Map(
    classifyEnglishBlocks(englishRows).map((segment) => [
      segment.segmentId,
      segment,
    ]),
  );
  const verifiedBySegment = new Map(
    rumiAlignmentReport.verified.map((alignment) => [
      alignment.segmentId,
      alignment,
    ]),
  );
  const refutedBySegment = new Map(
    rumiAlignmentReport.refuted.map((alignment) => [
      alignment.segmentId,
      alignment,
    ]),
  );
  const insufficientBySegment = new Map(
    rumiAlignmentReport.insufficientVotes.map((alignment) => [
      alignment.segmentId,
      alignment,
    ]),
  );
  const archivedIds = new Set(
    RUMI_ARCHIVED_SELECTION.map((selection) => selection.segmentId),
  );
  const rumiEnglishHash = requireSourceHash(
    lock.entries,
    'rumi-whinfield-abridged-en',
    '/source.epub',
  );
  const rumiPersianHash = requireSourceHash(
    lock.entries,
    'rumi-nicholson-fa-wikisource',
    '/source.epub',
  );
  const rumiCandidates = rumiCandidateReport.units.map(
    (unit): CandidateInventoryRecord => {
      const segment = classifiedSegments.get(unit.segmentId);
      if (segment === undefined) {
        throw new Error(
          `Candidate inventory is missing classified segment ${unit.segmentId}.`,
        );
      }
      const verified = verifiedBySegment.get(unit.segmentId);
      const refuted = refutedBySegment.get(unit.segmentId);
      const insufficient = insufficientBySegment.get(unit.segmentId);
      const selected = verified ?? refuted ?? insufficient;
      const topCandidate = unit.candidates[0];
      const persianSequence =
        selected?.persianSequence ?? topCandidate?.persianSequence;
      const status = archivedIds.has(unit.segmentId)
        ? ('archived' as const)
        : verified !== undefined
          ? ('verified' as const)
          : refuted !== undefined
            ? ('excluded' as const)
            : ('candidate' as const);
      const anchors = selected?.anchors ?? [];
      return {
        stableRecordId: `rumi-candidate-${unit.segmentId}`,
        poet: 'rumi',
        status,
        canonicalPersianIdentity:
          persianSequence === undefined
            ? null
            : `rumi-nicholson-fa-wikisource:section-${String(persianSequence)}`,
        englishSourceId: 'rumi-whinfield-abridged-en',
        englishLocation: unit.segmentId,
        englishSpanHash: segment.textSha256,
        persianSourceId: 'rumi-nicholson-fa-wikisource',
        persianLocation:
          persianSequence === undefined
            ? null
            : `masnavi-section:${String(persianSequence)}`,
        persianSpanHash:
          anchors.length > 0
            ? canonicalSha256(
                anchors
                  .map((anchor) => anchor.persian)
                  .filter((value): value is string => value !== undefined),
              )
            : (topCandidate?.persianSha256 ?? null),
        englishSourceHash: rumiEnglishHash,
        persianSourceHash: rumiPersianHash,
        mappingHash:
          selected === undefined || anchors.length === 0
            ? null
            : canonicalSha256({
                englishLocation: unit.segmentId,
                persianSequence,
                anchors,
              }),
        currentAuthorityKind: 'none',
        sourceEvidenceCurrent: true,
        finalContractAuthorityCurrent: false,
        duplicateGroupId: null,
        productionEligible: false,
        failureReasons: [
          status === 'archived'
            ? 'Verified historical alignment is archived outside production.'
            : status === 'verified'
              ? 'Verified historical alignment has no final-contract production authority in this candidate inventory.'
              : status === 'excluded'
                ? 'Historical candidate was refuted and is excluded.'
                : selected === undefined
                  ? 'Candidate has not received source-bound alignment authority.'
                  : 'Candidate has insufficient historical verification evidence.',
        ],
      };
    },
  );

  return [...hafezCandidates, ...rumiCandidates];
}

function machineBinding(item: AuthoringContentItem) {
  return {
    englishSourceId: item.source.english_source_id,
    englishSourceHash: item.source.english_source_sha256,
    englishReference: item.source.english_source_reference,
    persianSourceId: item.source.edition_id,
    persianSourceHash: item.source.persian_source_sha256,
    persianReference: `${item.source.reference_type}:${item.source.reference_value}`,
    canonicalIdentity: canonicalPersianIdentity(item),
    englishLines: item.text.english_lines,
    persianLines: item.text.persian_lines,
    mapping: item.text.mapping.map((entry) => ({
      englishIndex: entry.english_index,
      persianIndices: entry.persian_indices,
    })),
  };
}

function authorityBindsCanonicalIdentity(
  item: AuthoringContentItem,
  identity: string,
): boolean {
  if (item.review_authority.kind !== 'machine_alignment') {
    return true;
  }

  const authority = item.review_authority as unknown as Record<string, unknown>;
  return (
    authority['englishSourceId'] === item.source.english_source_id &&
    authority['persianSourceId'] === item.source.edition_id &&
    authority['canonicalIdentityHash'] === canonicalSha256(identity)
  );
}

export function buildCorpusInventory(
  input: BuildCorpusInventoryInput,
): CorpusInventory {
  const identities = input.items.map(canonicalPersianIdentity);
  const hafezIdentityCounts = new Map<string, number>();
  for (const [index, item] of input.items.entries()) {
    if (item.poet === 'hafez') {
      const identity = identities[index];
      if (identity !== undefined) {
        hafezIdentityCounts.set(
          identity,
          (hafezIdentityCounts.get(identity) ?? 0) + 1,
        );
      }
    }
  }

  const rumiLineOwners = new Map<string, string[]>();
  for (const item of input.items) {
    if (item.poet !== 'rumi') {
      continue;
    }
    for (const line of item.text.persian_lines) {
      const owners = rumiLineOwners.get(line) ?? [];
      owners.push(item.id);
      rumiLineOwners.set(line, owners);
    }
  }

  const records = input.items.map((item, index): CorpusInventoryRecord => {
    const binding = machineBinding(item);
    const digests = machineAuthorityDigests(binding);
    const identity = identities[index];
    if (identity === undefined) {
      throw new Error(`Missing canonical identity for ${item.id}.`);
    }
    const failureReasons: string[] = [];
    let sourceEvidenceCurrent = false;

    if (item.review_authority.kind === 'machine_alignment') {
      try {
        assertMachineAuthorityCurrent(
          binding,
          item.review_authority,
          input.buildDate,
        );
        sourceEvidenceCurrent = true;
      } catch (error) {
        failureReasons.push(
          error instanceof Error
            ? error.message
            : 'Machine authority could not be verified.',
        );
      }
    } else {
      sourceEvidenceCurrent = true;
    }

    const finalContractAuthorityCurrent =
      sourceEvidenceCurrent && authorityBindsCanonicalIdentity(item, identity);
    if (sourceEvidenceCurrent && !finalContractAuthorityCurrent) {
      failureReasons.push(
        'Machine authority does not bind the canonical identity.',
      );
    }

    const duplicateGroupId =
      item.poet === 'hafez' && (hafezIdentityCounts.get(identity) ?? 0) > 1
        ? canonicalSha256(identity).slice(0, 16)
        : item.poet === 'rumi' &&
            item.text.persian_lines.some(
              (line) => (rumiLineOwners.get(line)?.length ?? 0) > 1,
            )
          ? canonicalSha256(
              item.text.persian_lines.filter(
                (line) => (rumiLineOwners.get(line)?.length ?? 0) > 1,
              ),
            ).slice(0, 16)
          : null;
    const excluded =
      item.status === 'disabled' ||
      (item.review_authority.kind === 'machine_alignment' &&
        item.review_authority.verdict === 'EXCLUDED');

    return {
      stableRecordId: item.id,
      poet: item.poet,
      status: excluded ? 'excluded' : 'production',
      canonicalPersianIdentity: identity,
      englishSourceId: item.source.english_source_id,
      englishLocation: item.source.english_source_reference,
      englishSpanHash: digests.englishSpanHash,
      persianSourceId: item.source.edition_id,
      persianLocation: `${item.source.reference_type}:${item.source.reference_value}`,
      persianSpanHash: digests.persianSpanHash,
      englishSourceHash: item.source.english_source_sha256,
      persianSourceHash: item.source.persian_source_sha256,
      mappingHash: digests.mappingHash,
      currentAuthorityKind: item.review_authority.kind,
      sourceEvidenceCurrent,
      finalContractAuthorityCurrent,
      duplicateGroupId,
      productionEligible:
        item.status === 'approved' && sourceEvidenceCurrent && !excluded,
      failureReasons,
    };
  });

  const productionRecords = records.filter(
    (record) => record.productionEligible,
  );
  const validHafezIdentities = new Set(
    productionRecords
      .filter((record) => record.poet === 'hafez')
      .map((record) => record.canonicalPersianIdentity),
  );
  const validRumiIdentities = new Set(
    productionRecords
      .filter((record) => record.poet === 'rumi')
      .map((record) => record.canonicalPersianIdentity),
  );
  const duplicateHafezGhazalCount = [...hafezIdentityCounts.values()].reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );
  const overlappingRumiSpanCount = [...rumiLineOwners.values()].filter(
    (owners) => owners.length > 1,
  ).length;

  return {
    schemaVersion: 1,
    generatedAt: `${input.buildDate}T00:00:00.000Z`,
    targetPerPoet: input.targetPerPoet,
    records,
    candidates: [],
    summary: {
      validUniqueHafezCount: validHafezIdentities.size,
      validUniqueRumiCount: validRumiIdentities.size,
      finalContractStaleAuthorityCount: records.filter(
        (record) => !record.finalContractAuthorityCurrent,
      ).length,
      duplicateHafezGhazalCount,
      overlappingRumiSpanCount,
      excludedCount: records.filter((record) => record.status === 'excluded')
        .length,
      remainingHafezRequired: Math.max(
        0,
        input.targetPerPoet - validHafezIdentities.size,
      ),
      remainingRumiRequired: Math.max(
        0,
        input.targetPerPoet - validRumiIdentities.size,
      ),
    },
  };
}

async function main(): Promise<void> {
  const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
  const loaded = await loadContentPrivate({
    projectRoot: root,
    profile: 'production',
  });
  const inventory = buildCorpusInventory({
    items: loaded.items,
    buildDate: '2026-07-17',
    targetPerPoet: 60,
  });
  const candidates = await loadCandidateInventory(root);
  const completeInventory: CorpusInventory = { ...inventory, candidates };
  const destination = path.join(
    root,
    'docs/verification/2026-07-16-pre-expansion-corpus-inventory.json',
  );
  try {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(
      destination,
      `${JSON.stringify(completeInventory, null, 2)}\n`,
    );
  } catch (error) {
    throw new Error('Unable to write the pre-expansion corpus inventory.', {
      cause: error,
    });
  }
  process.stdout.write(
    `Pre-expansion inventory: ${String(inventory.summary.validUniqueHafezCount)} Hafez, ` +
      `${String(inventory.summary.validUniqueRumiCount)} Rumi, ` +
      `${String(inventory.summary.finalContractStaleAuthorityCount)} authorities requiring final-contract renewal, ` +
      `${String(candidates.length)} candidates recorded.\n`,
  );
}

const invokedPath =
  process.argv[1] === undefined ? '' : path.resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
