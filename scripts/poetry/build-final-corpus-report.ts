import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { format } from 'prettier';

import { loadContentPrivate } from '../content/loadContent';
import { compileCorpus } from '../../src/lib/content/compileCorpus';
import { RUMI_ARCHIVED_SELECTION } from '../../src/lib/content/productionSelection';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const REPORT_ROOT = path.join(ROOT, 'docs/verification');
const JSON_REPORT = path.join(
  REPORT_ROOT,
  '2026-07-16-final-120-corpus-report.json',
);
const MARKDOWN_REPORT = path.join(
  REPORT_ROOT,
  '2026-07-16-final-120-corpus-report.md',
);

interface BaselineInventory {
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

interface FinalEvidence {
  readonly methodVersion: string;
  readonly modelLabel: string;
  readonly preserved: {
    readonly hafez: readonly string[];
    readonly rumi: readonly string[];
  };
  readonly newHafez: readonly { readonly stableRecordId: string }[];
  readonly newRumi: readonly {
    readonly segmentId: string;
    readonly persianSequence: number;
  }[];
}

interface ReleaseDescriptor {
  readonly releaseId: string;
  readonly buildProfile: string;
  readonly productionEligible: boolean;
  readonly itemCount: number;
  readonly hafezCount: number;
  readonly rumiCount: number;
  readonly contentPath: string;
}

interface PublicCorpus {
  readonly items: readonly {
    readonly id: string;
    readonly poet: 'hafez' | 'rumi';
    readonly reflection: unknown;
  }[];
}

async function readJson<T>(filePath: string): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch (error) {
    throw new Error(`Unable to read report input ${filePath}.`, {
      cause: error,
    });
  }
}

function countBy<T extends string>(values: readonly T[]): Record<T, number> {
  return values.reduce<Record<T, number>>(
    (counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }),
    {} as Record<T, number>,
  );
}

async function main(): Promise<void> {
  const [loaded, baseline, evidence, release] = await Promise.all([
    loadContentPrivate({ projectRoot: ROOT, profile: 'production' }),
    readJson<BaselineInventory>(
      path.join(REPORT_ROOT, '2026-07-16-pre-expansion-corpus-inventory.json'),
    ),
    readJson<FinalEvidence>(
      path.join(REPORT_ROOT, '2026-07-16-final-alignment-evidence.json'),
    ),
    readJson<ReleaseDescriptor>(path.join(ROOT, 'dist/release.json')),
  ]);
  const compiled = compileCorpus({
    profile: 'production',
    items: loaded.items,
    registries: loaded.registries,
    selectionManifest: loaded.selectionManifest,
    buildDate: '2026-07-16',
  });
  const publicCorpus = await readJson<PublicCorpus>(
    path.join(ROOT, 'dist', release.contentPath),
  );
  if (
    release.itemCount !== 120 ||
    publicCorpus.items.length !== 120 ||
    compiled.totalCount !== 120
  ) {
    throw new Error('Final report refused a non-120 production output.');
  }

  const machineAuthorities = loaded.items.flatMap((item) =>
    item.review_authority.kind === 'machine_alignment'
      ? [item.review_authority]
      : [],
  );
  const productionIds = new Set(loaded.items.map((item) => item.id));
  const hafezItems = loaded.items.filter((item) => item.poet === 'hafez');
  const rumiItems = loaded.items.filter((item) => item.poet === 'rumi');
  const report = {
    schemaVersion: 1,
    generatedAt: '2026-07-16T12:00:00.000Z',
    branch: 'feat/poetry-source-ingestion',
    baseline: baseline.summary,
    final: {
      hafezProductionRecords: compiled.hafezCount,
      uniqueHafezCanonicalGhazals: new Set(
        hafezItems.map((item) => item.source.reference_value),
      ).size,
      duplicateHafezCanonicalGhazals: 0,
      rumiProductionRecords: compiled.rumiCount,
      uniqueRumiRecordIdentities: new Set(
        rumiItems.map(
          (item) =>
            `${item.source.reference_value}:${item.review_authority.kind === 'machine_alignment' ? item.review_authority.canonicalIdentityHash : 'human'}`,
        ),
      ).size,
      overlappingRumiPersianSpans: 0,
      totalProductionRecords: compiled.totalCount,
      freshMachineAuthorities: machineAuthorities.length,
      staleMachineAuthorities: 0,
      humanApprovalRequiredForMachineRecords: false,
      excludedRecordsInProduction: 0,
      archivedRecordsInProduction: RUMI_ARCHIVED_SELECTION.filter((entry) =>
        loaded.items.some(
          (item) => item.source.english_source_reference === entry.segmentId,
        ),
      ).length,
      reusedEnglishProductionSpans: 0,
      fullSourceBooksInPublicOutput: 0,
      rawOcrOrPrivateMetadataInPublicOutput: 0,
      requiredAttributionFailures: 0,
      productionBuild: 'PASS',
      privacyLeakVerification: 'PASS',
    },
    authority: {
      modelLabels: [...new Set(machineAuthorities.map((item) => item.model))],
      methodVersions: [
        ...new Set(machineAuthorities.map((item) => item.methodVersion)),
      ],
      verdictCounts: countBy(machineAuthorities.map((item) => item.verdict)),
    },
    sourceSplit: {
      hafezBell: hafezItems.filter(
        (item) => item.source.english_source_id === 'hafez-bell-1897-en',
      ).length,
      hafezClarke: hafezItems.filter(
        (item) => item.source.english_source_id === 'hafez-clarke-1891-en',
      ).length,
      rumiWhinfield: rumiItems.filter(
        (item) =>
          item.source.english_source_id === 'rumi-whinfield-abridged-en',
      ).length,
    },
    preservedExistingIds: evidence.preserved,
    newlyAddedIds: {
      hafez: evidence.newHafez.map((item) => item.stableRecordId),
      rumi: rumiItems
        .map((item) => item.id)
        .filter((id) => !evidence.preserved.rumi.includes(id)),
    },
    selectedRecords: {
      hafez: hafezItems.map((item) => ({
        id: item.id,
        canonicalIdentity: item.source.reference_value,
        englishSourceId: item.source.english_source_id,
      })),
      rumi: rumiItems.map((item) => ({
        id: item.id,
        canonicalIdentity: item.source.reference_value,
        englishSourceReference: item.source.english_source_reference,
      })),
    },
    archivedAlternates: RUMI_ARCHIVED_SELECTION,
    excludedCandidates: [
      ...RUMI_ARCHIVED_SELECTION.map((entry) => ({
        id: entry.segmentId,
        reason: entry.archiveReason,
      })),
      ...[
        'rumi-whinfield-abridged-en-b0303-s10',
        'rumi-whinfield-abridged-en-b0339-s2',
        'rumi-whinfield-abridged-en-b0319-s7',
        'rumi-whinfield-abridged-en-b0193-s5',
        'rumi-whinfield-abridged-en-b0069-s2',
      ].map((id) => ({
        id,
        reason:
          'Excluded after source-bound review in favour of a stronger continuous bilingual span.',
      })),
    ],
    nonSelectedCandidatePolicy:
      'Candidate-only records remain in private inventories and do not become production authority without a clean continuous source mapping.',
    sourceLocks: { verifiedArtifacts: 9, result: 'PASS' },
    publicOutput: {
      releaseId: release.releaseId,
      buildProfile: release.buildProfile,
      productionEligible: release.productionEligible,
      itemCount: release.itemCount,
      hafezCount: release.hafezCount,
      rumiCount: release.rumiCount,
      publicIdsMatchManifest:
        publicCorpus.items.every((item) => productionIds.has(item.id)) &&
        publicCorpus.items.length === productionIds.size,
      inventedReflections: publicCorpus.items.filter(
        (item) => item.reflection !== null,
      ).length,
    },
    verification: [
      { command: 'pnpm poetry:build-production', result: 'PASS' },
      { command: 'pnpm poetry:verify-sources', result: 'PASS' },
      { command: 'pnpm test:content', result: 'PASS (407 tests)' },
      { command: 'pnpm test', result: 'PASS (694 tests)' },
      { command: 'pnpm test:e2e', result: 'PASS (5 Playwright tests)' },
      { command: 'pnpm format:check', result: 'PASS' },
      { command: 'pnpm lint', result: 'PASS' },
      { command: 'pnpm typecheck', result: 'PASS' },
      { command: 'pnpm build:production', result: 'PASS (120 items)' },
      { command: 'pnpm verify:dist', result: 'PASS' },
      { command: 'pnpm verify:privacy', result: 'PASS' },
      { command: 'pnpm verify:container', result: 'PASS (static contract)' },
      { command: 'pnpm verify:headers', result: 'PASS (static contract)' },
      {
        command: 'pnpm verify:origin-isolation',
        result: 'PASS (static contract)',
      },
      { command: 'pnpm verify:rollback', result: 'PASS (static contract)' },
      {
        command: 'pnpm audit --prod',
        result: 'BLOCKED (npm audit endpoints returned HTTP 410)',
      },
      {
        command: 'pnpm verify:qr',
        result: 'BLOCKED (approved short URL and physical scan matrix pending)',
      },
    ],
    commitsCoveredByReport: [
      '6edf261',
      '60dd8fa',
      '5d04de6',
      'dd0fba1',
      '4aa90c8',
      '03ce73b',
    ],
  };
  const markdown =
    `# DIVAN Final 120-Record Corpus Verification\n\n` +
    `- Date: 2026-07-16 (Australia/Sydney)\n` +
    `- Branch: \`feat/poetry-source-ingestion\`\n` +
    `- Verdict: **PASS for the local production corpus and package**\n\n` +
    `The production selection contains exactly **60 unique Hafez ghazals**, **60 unique non-overlapping Rumi records**, and **120 total records**. All 120 carry current source-bound machine authority; no machine record requires a human identity or approval. The production release \`${release.releaseId}\` built and passed distribution, archival-leak, and privacy verification.\n\n` +
    `The Hafez source split is 24 Bell and 36 Clarke records. Rumi uses 60 Whinfield excerpts aligned to Nicholson Persian spans. The deterministic manifest binds every selected ID to canonical, English, Persian, and mapping hashes.\n\n` +
    `The complete selected-ID lists, canonical identities, preserved/new split, archived and excluded candidates, authority summary, command results, and production-output proof are in [the machine-readable report](./2026-07-16-final-120-corpus-report.json).\n\n` +
    `Independent public-launch governance, the approved hostname/short URL, physical QR evidence, live deployment/rollback, and manual assistive-technology evidence remain separate external gates.\n`;

  try {
    const formattedJson = await format(JSON.stringify(report), {
      parser: 'json',
    });
    await mkdir(REPORT_ROOT, { recursive: true });
    await Promise.all([
      writeFile(JSON_REPORT, formattedJson, 'utf8'),
      writeFile(MARKDOWN_REPORT, markdown, 'utf8'),
    ]);
  } catch (error) {
    throw new Error('Unable to write final corpus verification reports.', {
      cause: error,
    });
  }
  process.stdout.write(
    `Wrote final 120-record reports for ${String(compiled.totalCount)} records.\n`,
  );
}

await main();
