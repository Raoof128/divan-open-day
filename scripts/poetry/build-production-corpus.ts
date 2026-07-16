import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { stringify } from 'yaml';

import { authoringContentItemSchema } from '../../src/lib/content/authoringSchema';
import { canonicalSha256 } from '../../src/lib/content/canonical';
import { productionSelectionManifestSchema } from '../../src/lib/content/productionManifest';
import {
  HAFEZ_PRODUCTION_SELECTION,
  RUMI_ARCHIVED_SELECTION,
  RUMI_PRODUCTION_SELECTION,
} from '../../src/lib/content/productionSelection';
import { registryBundleSchema } from '../../src/lib/content/registrySchemas';
import { machineAuthorityDigests } from '../../src/lib/content/reviewAuthority';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const POETRY_ROOT = path.join(ROOT, 'sources-private/poetry');
const CONTENT_ROOT = path.join(ROOT, 'content-private');

const SOURCE_HASHES = {
  bell: '99d9a385326982b4cbf63aeb90cf257d6e162f3f7534378857a21c8e85902145',
  clarkeVolume1:
    '8656a50af1b0c67738e3aa736a9a15db6deb57d232b5194b434d823016dcc154',
  clarkeVolume2:
    'f754625ad11de7f566fc10fd5a49667a29dd6f3a88f6700d2bdb6035c6ba2e6f',
  hafezPersian:
    'a968d2f88feca9476da21b830fe3cdf2b22daca7dd6364c8c46600293cb7515b',
  nicholson: '04a80365a6c4938fc8208fa501ead01a6eede8883f68c7cf588a9ca33f0814d7',
  whinfield: 'd629e8abbd40ff5cfe5ec24dc4fa3733a4400714695aaf9bf59a4c9d01e9d38d',
} as const;

const PUBLIC_USES = [
  'website_display',
  'downloadable_share_card',
  'event_print',
  'archival_hosting',
] as const;

const OCR_OPENING_CORRECTIONS = new Map<string, string>([
  ['hafez-bell-1897-p073', 'Wind from the east, oh Lapwing of the day,'],
  ['hafez-bell-1897-p080', 'Oh Cup-bearer, set my glass afire'],
  ['hafez-bell-1897-p083', 'Mirth, Spring, to linger in a garden fair,'],
  ['hafez-bell-1897-p084', 'Where is my ruined life, and where the fame'],
  ['hafez-bell-1897-p087', "The nightingale with drops of his heart's blood"],
  ['hafez-bell-1897-p093', 'What drunkenness is this that brings me hope—'],
  ['hafez-bell-1897-p097', "The rose is not fair without the beloved's face,"],
  ['hafez-bell-1897-p101', 'The days of absence and the bitter nights'],
  ['hafez-bell-1897-p102', 'The secret draught of wine and love repressed'],
  ['hafez-bell-1897-p107', 'All hail, Shiraz, hail! oh site without peer!'],
  [
    'hafez-bell-1897-p108',
    "The breath of Dawn's musk-strewing wind shall blow,",
  ],
  ['hafez-bell-1897-p113', 'Forget not when dear friend to friend returned,'],
]);

interface BellLine {
  readonly text: string;
  readonly status: 'corroborated' | 'disputed';
}
interface BellPoem {
  readonly poemId: string;
  readonly bellNumber: string;
  readonly scanPageStart: number;
  readonly lines: readonly BellLine[];
}
interface HafezGhazal {
  readonly ghazalNumber: number;
  readonly documentPath: string;
  readonly hemistichs: readonly string[];
}
interface RumiAnchor {
  readonly english: string;
  readonly persian: string;
}
interface RumiVerifiedAlignment {
  readonly segmentId: string;
  readonly persianSequence: number;
  readonly votes: number;
  readonly relationship: 'direct' | 'abridged' | 'composite';
  readonly confidence: 'high';
  readonly anchors: readonly RumiAnchor[];
  readonly disclosure: string | null;
  readonly rationale: string;
}
interface EvidenceMapping {
  readonly englishIndex: number;
  readonly persianIndices: readonly number[];
}
interface HafezFinalEvidence {
  readonly stableRecordId: string;
  readonly volume: 'volume-1' | 'volume-2';
  readonly page: number;
  readonly ode: number;
  readonly concordance: number;
  readonly ghazalNumber: number;
  readonly englishLines: readonly string[];
  readonly persianLines: readonly string[];
  readonly mapping: readonly EvidenceMapping[];
  readonly retrievalScore: number;
  readonly anchors: readonly RumiAnchor[];
  readonly disclosures: readonly string[];
}
interface RumiFinalEvidence {
  readonly segmentId: string;
  readonly persianSequence: number;
  readonly englishLineStart: number;
  readonly persianLineStart: number;
  readonly englishLines: readonly string[];
  readonly persianLines: readonly string[];
  readonly mapping: readonly EvidenceMapping[];
  readonly retrievalScore: number;
  readonly anchors: readonly RumiAnchor[];
  readonly disclosures: readonly string[];
}
interface FinalAlignmentEvidence {
  readonly modelLabel: string;
  readonly methodVersion: string;
  readonly newHafez: readonly HafezFinalEvidence[];
  readonly newRumi: readonly RumiFinalEvidence[];
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readJson<T>(relativePath: string): Promise<T> {
  try {
    return JSON.parse(
      await readFile(path.join(ROOT, relativePath), 'utf8'),
    ) as T;
  } catch (error) {
    throw new Error(`Unable to read JSON source ${relativePath}.`, {
      cause: error,
    });
  }
}

async function readJsonLines<T>(relativePath: string): Promise<T[]> {
  try {
    const source = await readFile(path.join(ROOT, relativePath), 'utf8');
    return source
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  } catch (error) {
    throw new Error(`Unable to read JSONL source ${relativePath}.`, {
      cause: error,
    });
  }
}

async function assertSourceHash(
  relativePath: string,
  expectedHash: string,
): Promise<void> {
  let bytes: Uint8Array;
  try {
    bytes = await readFile(path.join(POETRY_ROOT, relativePath));
  } catch (error) {
    throw new Error(
      `Required private source is unavailable: ${relativePath}.`,
      {
        cause: error,
      },
    );
  }
  const actualHash = sha256(bytes);
  if (actualHash !== expectedHash) {
    throw new Error(
      `Private source hash mismatch for ${relativePath}: expected ${expectedHash}, received ${actualHash}.`,
    );
  }
}

function itemMapping() {
  return [
    { english_index: 0, persian_indices: [0] },
    { english_index: 1, persian_indices: [1] },
  ];
}

function hafezMapping() {
  return [
    { english_index: 0, persian_indices: [0] },
    { english_index: 1, persian_indices: [0] },
  ];
}

function authorityFor(
  source: {
    readonly english_source_id: string;
    readonly english_source_sha256: string;
    readonly english_source_reference: string;
    readonly edition_id: string;
    readonly persian_source_sha256: string;
    readonly reference_type: string;
    readonly reference_value: string;
  },
  text: {
    readonly english_lines: readonly string[];
    readonly persian_lines: readonly string[];
    readonly mapping: ReturnType<typeof itemMapping>;
  },
  evidence: {
    readonly disclosures: readonly string[];
    readonly confidence: number;
    readonly rationale: string;
    readonly model?: string;
    readonly methodVersion?: string;
  },
) {
  const binding = {
    englishSourceId: source.english_source_id,
    englishSourceHash: source.english_source_sha256,
    englishReference: source.english_source_reference,
    persianSourceId: source.edition_id,
    persianSourceHash: source.persian_source_sha256,
    persianReference: `${source.reference_type}:${source.reference_value}`,
    canonicalIdentity: `${source.edition_id}:${source.reference_type}:${source.reference_value
      .trim()
      .toLowerCase()}${
      source.reference_type === 'masnavi'
        ? `:${canonicalSha256(text.persian_lines)}`
        : ''
    }`,
    englishLines: text.english_lines,
    persianLines: text.persian_lines,
    mapping: text.mapping.map((entry) => ({
      englishIndex: entry.english_index,
      persianIndices: entry.persian_indices,
    })),
  };
  const digests = machineAuthorityDigests(binding);
  return {
    kind: 'machine_alignment' as const,
    model: evidence.model ?? 'gpt-5.5-codex',
    methodVersion: evidence.methodVersion ?? 'source-bound-alignment-v2',
    englishSourceId: binding.englishSourceId,
    englishSourceHash: source.english_source_sha256,
    persianSourceId: binding.persianSourceId,
    persianSourceHash: source.persian_source_sha256,
    canonicalIdentityHash: digests.canonicalIdentityHash,
    englishSpanHash: digests.englishSpanHash,
    persianSpanHash: digests.persianSpanHash,
    mappingHash: digests.mappingHash,
    verdict:
      evidence.disclosures.length === 0
        ? ('MACHINE_VERIFIED' as const)
        : ('MACHINE_VERIFIED_WITH_DISCLOSURE' as const),
    confidence: evidence.confidence,
    disclosures: evidence.disclosures,
    verifiedAt: '2026-07-16',
    rationale: evidence.rationale,
  };
}

function commonItemFields(poet: 'hafez' | 'rumi') {
  return {
    schema_version: 2 as const,
    status: 'approved' as const,
    poet,
    mode:
      poet === 'hafez'
        ? ('open_the_divan' as const)
        : ('moment_of_reflection' as const),
    display: {
      visual_variant:
        poet === 'hafez'
          ? ('garden_night' as const)
          : ('lamp_constellation' as const),
      accent: poet === 'hafez' ? ('pomegranate' as const) : ('lapis' as const),
    },
    reflection: null,
    audio: {
      enabled: false as const,
      asset_path: null,
      mime_type: null,
      performer_id: null,
      performer_public_credit: null,
      permission_record_id: null,
      duration_seconds: null,
    },
    review: null,
  };
}

function makeHafezItems(
  poems: readonly BellPoem[],
  ghazals: readonly HafezGhazal[],
) {
  const poemsById = new Map(poems.map((poem) => [poem.poemId, poem]));
  const ghazalsByNumber = new Map(
    ghazals.map((ghazal) => [ghazal.ghazalNumber, ghazal]),
  );

  return HAFEZ_PRODUCTION_SELECTION.map((selection) => {
    const poem = poemsById.get(selection.bellPoemId);
    const ghazal = ghazalsByNumber.get(selection.ghazalNumber);
    if (poem === undefined || ghazal === undefined) {
      throw new Error(
        `Missing Hafez source evidence for ${selection.bellPoemId} -> ${String(selection.ghazalNumber)}.`,
      );
    }
    const correctedOpening = OCR_OPENING_CORRECTIONS.get(poem.poemId);
    const selectedLines = poem.lines.slice(0, 2);
    const hasUnresolvedLine = selectedLines.some(
      (line, index) =>
        line.status !== 'corroborated' &&
        !(index === 0 && correctedOpening !== undefined),
    );
    if (
      poem.scanPageStart !== selection.bellPage ||
      selectedLines.length !== 2 ||
      hasUnresolvedLine ||
      ghazal.hemistichs.length < 1
    ) {
      throw new Error(
        `Weak or incoherent Hafez source span for ${poem.poemId}.`,
      );
    }

    const englishLines = selectedLines.map((line, index) =>
      index === 0 && correctedOpening !== undefined
        ? correctedOpening
        : line.text,
    );
    const id = `hafez-ghazal-${String(selection.ghazalNumber).padStart(3, '0')}-bell`;
    const source = {
      work_en: 'Poems from the Divan of Hafiz',
      work_fa: 'دیوان حافظ',
      edition_id: 'hafez-qazvini-ghani-fa-wikisource',
      edition_citation:
        'Qazvini-Ghani Divan transcription; local source lock and extraction evidence.',
      edition_public_credit:
        'Persian text: Divan of Hafez, Qazvini-Ghani edition, Persian Wikisource transcription (CC BY-SA).',
      reference_type: 'ghazal' as const,
      reference_value: `Ghazal ${String(selection.ghazalNumber)}`,
      opening_hemistich_fa: ghazal.hemistichs[0] ?? null,
      page_reference: `Bell poem ${poem.bellNumber}, scan page ${String(poem.scanPageStart)}`,
      source_language: 'fa' as const,
      english_source_id: 'hafez-bell-1897-en',
      english_source_sha256: SOURCE_HASHES.bell,
      english_source_reference: `Bell poem ${poem.bellNumber}, scan page ${String(poem.scanPageStart)}`,
      persian_source_sha256: SOURCE_HASHES.hafezPersian,
    };
    const text = {
      persian_lines: ghazal.hemistichs.slice(0, 1),
      english_lines: englishLines,
      alignment: 'line' as const,
      mapping: hafezMapping(),
    };
    const disclosures =
      correctedOpening === undefined
        ? []
        : [
            'An obvious small-cap OCR error in the opening word was normalized against the Bell scan; wording and punctuation otherwise follow the selected source span.',
          ];
    const translation = {
      classification: 'public_domain_translation' as const,
      translator_ids: [],
      rights_owner:
        'Gertrude Lowthian Bell translation (1897), public domain; Persian Wikisource transcription is CC BY-SA.',
      permission_record_id: `${id}-translation-permission`,
      public_credit:
        'English translation: Gertrude Lowthian Bell, Poems from the Divan of Hafiz, 1897 (a selection).',
      permitted_uses: [...PUBLIC_USES],
      moral_rights_notes: null,
    };
    return authoringContentItemSchema.parse({
      id,
      ...commonItemFields('hafez'),
      source,
      text,
      translation,
      review_authority: authorityFor(source, text, {
        disclosures,
        confidence: correctedOpening === undefined ? 0.99 : 0.97,
        rationale:
          correctedOpening === undefined
            ? `Bell poem ${poem.bellNumber} on scan page ${String(poem.scanPageStart)} was aligned to Qazvini-Ghani ghazal ${String(selection.ghazalNumber)} by its opening imagery, wording, and poem-level sequence; both selected English lines were independently corroborated in the Bell reconstruction.`
            : `Bell poem ${poem.bellNumber} on scan page ${String(poem.scanPageStart)} was aligned to Qazvini-Ghani ghazal ${String(selection.ghazalNumber)} by its opening imagery, wording, and poem-level sequence; the opening small-cap OCR form was normalized against the scan and disclosed, while the second selected line is corroborated.`,
      }),
    });
  });
}

function evidenceMapping(mapping: readonly EvidenceMapping[]) {
  return mapping.map((entry) => ({
    english_index: entry.englishIndex,
    persian_indices: [...entry.persianIndices],
  }));
}

function makeClarkeHafezItems(
  records: readonly HafezFinalEvidence[],
  evidence: Pick<FinalAlignmentEvidence, 'modelLabel' | 'methodVersion'>,
) {
  return records.map((record) => {
    const id = record.stableRecordId;
    const englishHash =
      record.volume === 'volume-1'
        ? SOURCE_HASHES.clarkeVolume1
        : SOURCE_HASHES.clarkeVolume2;
    const sourceReference = `Clarke ${record.volume}, ode ${String(record.ode)} (${String(record.concordance)}), scan page ${String(record.page)}`;
    const source = {
      work_en:
        'The Divan, Written in the Fourteenth Century by Khwaja Shams-ud-Din Muhammad-i-Hafiz-i-Shirazi',
      work_fa: 'دیوان حافظ',
      edition_id: 'hafez-qazvini-ghani-fa-wikisource',
      edition_citation:
        'Qazvini-Ghani Divan transcription; local source lock and extraction evidence.',
      edition_public_credit:
        'Persian text: Divan of Hafez, Qazvini-Ghani edition, Persian Wikisource transcription (CC BY-SA).',
      reference_type: 'ghazal' as const,
      reference_value: `Ghazal ${String(record.ghazalNumber)}`,
      opening_hemistich_fa: record.persianLines[0] ?? null,
      page_reference: sourceReference,
      source_language: 'fa' as const,
      english_source_id: 'hafez-clarke-1891-en',
      english_source_sha256: englishHash,
      english_source_reference: sourceReference,
      persian_source_sha256: SOURCE_HASHES.hafezPersian,
    };
    const text = {
      persian_lines: [...record.persianLines],
      english_lines: [...record.englishLines],
      alignment: 'line' as const,
      mapping: evidenceMapping(record.mapping),
    };
    const translation = {
      classification: 'public_domain_translation' as const,
      translator_ids: [],
      rights_owner:
        'H. Wilberforce Clarke translation (1891), public domain; Persian Wikisource transcription is CC BY-SA.',
      permission_record_id: `${id}-translation-permission`,
      public_credit:
        'English translation: H. Wilberforce Clarke, The Divan of Hafiz (1891).',
      permitted_uses: [...PUBLIC_USES],
      moral_rights_notes: null,
    };
    return authoringContentItemSchema.parse({
      id,
      ...commonItemFields('hafez'),
      source,
      text,
      translation,
      review_authority: authorityFor(source, text, {
        model: evidence.modelLabel,
        methodVersion: evidence.methodVersion,
        disclosures: record.disclosures,
        confidence: Math.max(0.8, Math.min(0.99, record.retrievalScore)),
        rationale: `The selected Clarke opening at ${sourceReference} resolves to Qazvini-Ghani ghazal ${String(record.ghazalNumber)} through an exact continuous source span and ${String(record.anchors.length)} independent bilingual anchors.`,
      }),
    });
  });
}

function makeRumiItems(verified: readonly RumiVerifiedAlignment[]) {
  const verifiedBySegment = new Map(
    verified.map((alignment) => [alignment.segmentId, alignment]),
  );
  return RUMI_PRODUCTION_SELECTION.map((selection) => {
    const alignment = verifiedBySegment.get(selection.segmentId);
    if (
      alignment === undefined ||
      alignment.persianSequence !== selection.persianSequence ||
      alignment.anchors.length < 3
    ) {
      throw new Error(
        `Missing verified Rumi evidence for ${selection.segmentId}.`,
      );
    }
    const selectedAnchors = alignment.anchors.slice(0, 2);
    const id = `rumi-masnavi-${String(selection.persianSequence).padStart(4, '0')}-whinfield`;
    const source = {
      work_en: "Masnavi I Ma'navi",
      work_fa: 'مثنوی معنوی',
      edition_id: 'rumi-nicholson-fa-wikisource',
      edition_citation:
        'Nicholson Masnavi transcription; local source lock, section snapshot, and alignment evidence.',
      edition_public_credit:
        'Persian text: Masnavi, Nicholson edition, Persian Wikisource transcription (CC BY-SA).',
      reference_type: 'masnavi' as const,
      reference_value: `Nicholson section ${String(selection.persianSequence)}`,
      opening_hemistich_fa: null,
      page_reference: null,
      source_language: 'fa' as const,
      english_source_id: 'rumi-whinfield-abridged-en',
      english_source_sha256: SOURCE_HASHES.whinfield,
      english_source_reference: selection.segmentId,
      persian_source_sha256: SOURCE_HASHES.nicholson,
    };
    const text = {
      persian_lines: selectedAnchors.map((anchor) => anchor.persian),
      english_lines: selectedAnchors.map((anchor) => anchor.english),
      alignment: 'line' as const,
      mapping: itemMapping(),
    };
    const disclosures =
      alignment.disclosure === null ? [] : [alignment.disclosure];
    const translation = {
      classification: 'public_domain_translation' as const,
      translator_ids: [],
      rights_owner:
        'E. H. Whinfield abridged translation, public domain; Wikisource transcription terms apply.',
      permission_record_id: `${id}-translation-permission`,
      public_credit:
        "English translation: E. H. Whinfield, Masnavi I Ma'navi (abridged).",
      permitted_uses: [...PUBLIC_USES],
      moral_rights_notes: null,
    };
    return authoringContentItemSchema.parse({
      id,
      ...commonItemFields('rumi'),
      source,
      text,
      translation,
      review_authority: authorityFor(source, text, {
        disclosures,
        confidence: Math.min(
          0.99,
          0.82 + alignment.votes * 0.02 + alignment.anchors.length * 0.005,
        ),
        rationale: alignment.rationale,
      }),
    });
  });
}

function makeEvidenceRumiItems(
  records: readonly RumiFinalEvidence[],
  evidence: Pick<FinalAlignmentEvidence, 'modelLabel' | 'methodVersion'>,
) {
  return records.map((record) => {
    const id = `rumi-masnavi-${String(record.persianSequence).padStart(4, '0')}-whinfield`;
    const source = {
      work_en: "Masnavi I Ma'navi",
      work_fa: 'مثنوی معنوی',
      edition_id: 'rumi-nicholson-fa-wikisource',
      edition_citation:
        'Nicholson Masnavi transcription; local source lock, section snapshot, and alignment evidence.',
      edition_public_credit:
        'Persian text: Masnavi, Nicholson edition, Persian Wikisource transcription (CC BY-SA).',
      reference_type: 'masnavi' as const,
      reference_value: `Nicholson section ${String(record.persianSequence)}`,
      opening_hemistich_fa: null,
      page_reference: null,
      source_language: 'fa' as const,
      english_source_id: 'rumi-whinfield-abridged-en',
      english_source_sha256: SOURCE_HASHES.whinfield,
      english_source_reference: `${record.segmentId}:lines-${String(record.englishLineStart)}-${String(record.englishLineStart + record.englishLines.length - 1)}`,
      persian_source_sha256: SOURCE_HASHES.nicholson,
    };
    const text = {
      persian_lines: [...record.persianLines],
      english_lines: [...record.englishLines],
      alignment: 'line' as const,
      mapping: evidenceMapping(record.mapping),
    };
    const translation = {
      classification: 'public_domain_translation' as const,
      translator_ids: [],
      rights_owner:
        'E. H. Whinfield abridged translation, public domain; Wikisource transcription terms apply.',
      permission_record_id: `${id}-translation-permission`,
      public_credit:
        "English translation: E. H. Whinfield, Masnavi I Ma'navi (abridged).",
      permitted_uses: [...PUBLIC_USES],
      moral_rights_notes: null,
    };
    return authoringContentItemSchema.parse({
      id,
      ...commonItemFields('rumi'),
      source,
      text,
      translation,
      review_authority: authorityFor(source, text, {
        model: evidence.modelLabel,
        methodVersion: evidence.methodVersion,
        disclosures: record.disclosures,
        confidence: Math.max(0.8, Math.min(0.99, record.retrievalScore)),
        rationale: `The continuous Whinfield lines beginning at ${String(record.englishLineStart)} resolve to the continuous Nicholson section ${String(record.persianSequence)} span beginning at ${String(record.persianLineStart)}, supported by ${String(record.anchors.length)} independent same-context anchors.`,
      }),
    });
  });
}

type AuthoringItem = ReturnType<typeof authoringContentItemSchema.parse>;

function makeRegistries(items: readonly AuthoringItem[]) {
  return registryBundleSchema.parse({
    editions: {
      schema_version: 1,
      editions: [
        {
          id: 'hafez-qazvini-ghani-fa-wikisource',
          status: 'active',
          poet: 'hafez',
          source_language: 'fa',
          citation:
            'Qazvini-Ghani Divan transcription; local source lock and extraction evidence.',
          public_credit:
            'Persian text: Divan of Hafez, Qazvini-Ghani edition, Persian Wikisource transcription (CC BY-SA).',
        },
        {
          id: 'rumi-nicholson-fa-wikisource',
          status: 'active',
          poet: 'rumi',
          source_language: 'fa',
          citation:
            'Nicholson Masnavi transcription; local source lock, section snapshot, and alignment evidence.',
          public_credit:
            'Persian text: Masnavi, Nicholson edition, Persian Wikisource transcription (CC BY-SA).',
        },
      ],
    },
    contributors: { schema_version: 1, contributors: [] },
    permissions: {
      schema_version: 1,
      permissions: items.map((item) => ({
        id: item.translation.permission_record_id,
        status: 'active',
        kind: 'translation',
        subject_id: item.id,
        rights_owner: item.translation.rights_owner,
        evidence_reference:
          'sources-private/poetry/rights-evidence.yaml and source-lock.json',
        permitted_uses: [...PUBLIC_USES],
        attribution: item.translation.public_credit,
        modification_permitted: true,
        territories: ['worldwide'],
        effective_on: '2026-07-16',
        expires_on: null,
      })),
    },
    approvals: { schema_version: 1, approvals: [] },
    assets: { schema_version: 1, assets: [] },
  });
}

function makeSelectionManifest(items: readonly AuthoringItem[]) {
  return productionSelectionManifestSchema.parse({
    schema_version: 1,
    records: [...items]
      .sort(
        (left, right) =>
          left.poet.localeCompare(right.poet, 'en') ||
          left.id.localeCompare(right.id, 'en'),
      )
      .map((item) => {
        if (item.review_authority.kind !== 'machine_alignment') {
          throw new Error(
            `Production item ${item.id} lacks machine authority.`,
          );
        }
        return {
          item_id: item.id,
          poet: item.poet,
          canonical_identity_hash: item.review_authority.canonicalIdentityHash,
          english_span_hash: item.review_authority.englishSpanHash,
          persian_span_hash: item.review_authority.persianSpanHash,
          mapping_hash: item.review_authority.mappingHash,
        };
      }),
  });
}

async function writeYaml(relativePath: string, value: unknown): Promise<void> {
  const destination = path.join(CONTENT_ROOT, relativePath);
  try {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, stringify(value, { lineWidth: 0 }), 'utf8');
  } catch (error) {
    throw new Error(`Unable to write canonical content ${relativePath}.`, {
      cause: error,
    });
  }
}

export async function buildProductionCorpus(): Promise<void> {
  await Promise.all([
    assertSourceHash('raw/hafez-bell-1897-en/source.pdf', SOURCE_HASHES.bell),
    assertSourceHash(
      'raw/hafez-qazvini-ghani-fa-wikisource/source.epub',
      SOURCE_HASHES.hafezPersian,
    ),
    assertSourceHash(
      'raw/hafez-clarke-1891-en/volume-1.pdf',
      SOURCE_HASHES.clarkeVolume1,
    ),
    assertSourceHash(
      'raw/hafez-clarke-1891-en/volume-2.pdf',
      SOURCE_HASHES.clarkeVolume2,
    ),
    assertSourceHash(
      'raw/rumi-nicholson-fa-wikisource/source.epub',
      SOURCE_HASHES.nicholson,
    ),
    assertSourceHash(
      'raw/rumi-whinfield-abridged-en/source.epub',
      SOURCE_HASHES.whinfield,
    ),
  ]);
  const [bell, ghazals, alignmentReport, finalEvidence] = await Promise.all([
    readJson<{ readonly poems: readonly BellPoem[] }>(
      'sources-private/poetry/bell-ocr/bell-poems.json',
    ),
    readJsonLines<HafezGhazal>(
      'sources-private/poetry/extracted/hafez-ghazals-fa.jsonl',
    ),
    readJson<{ readonly verified: readonly RumiVerifiedAlignment[] }>(
      'sources-private/poetry/reports/rumi-alignment-candidates.json',
    ),
    readJson<FinalAlignmentEvidence>(
      'docs/verification/2026-07-16-final-alignment-evidence.json',
    ),
  ]);
  const hafezItems = [
    ...makeHafezItems(bell.poems, ghazals),
    ...makeClarkeHafezItems(finalEvidence.newHafez, finalEvidence),
  ];
  const rumiItems = [
    ...makeRumiItems(alignmentReport.verified),
    ...makeEvidenceRumiItems(finalEvidence.newRumi, finalEvidence),
  ];
  const registries = makeRegistries([...hafezItems, ...rumiItems]);
  const selectionManifest = makeSelectionManifest([
    ...hafezItems,
    ...rumiItems,
  ]);
  await Promise.all([
    ...hafezItems.map((item) => writeYaml(`hafez/${item.id}.yaml`, item)),
    ...rumiItems.map((item) => writeYaml(`rumi/${item.id}.yaml`, item)),
    writeYaml('editions.yaml', registries.editions),
    writeYaml('contributors.yaml', registries.contributors),
    writeYaml('permissions.yaml', registries.permissions),
    writeYaml('approvals.yaml', registries.approvals),
    writeYaml('assets.yaml', registries.assets),
    writeYaml('production-selection.yaml', selectionManifest),
  ]);
}

const invokedPath =
  process.argv[1] === undefined ? '' : path.resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  await buildProductionCorpus();
  process.stdout.write(
    `Built 60 Hafez and 60 Rumi canonical records; archived ${String(RUMI_ARCHIVED_SELECTION.length)} Rumi records separately.\n`,
  );
}
