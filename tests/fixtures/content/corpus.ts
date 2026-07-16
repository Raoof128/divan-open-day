import { createHash } from 'node:crypto';

import { canonicalSha256 } from '../../../src/lib/content/canonical';

const REQUIRED_PUBLIC_USES = [
  'website_display',
  'downloadable_share_card',
  'event_print',
  'archival_hosting',
];

const TEST_ONLY_REFLECTION =
  'TEST ONLY / NOT INTERPRETATION. This synthetic validation record contains neutral automated testing words only. It is not poetry, not translation, not commentary, not guidance, and not approved publication content. No phrase represents an author, source, culture, person, belief, event, or real permission. The record exists only to test compiler boundaries and must never enter a production build.';

export const TEST_ONLY_AUDIO_BYTES = new TextEncoder().encode(
  'TEST ONLY - NOT AUDIO',
);

function sequenceId(poet: 'hafez' | 'rumi', index: number): string {
  return `test-only-${poet}-${String(index + 1).padStart(2, '0')}`;
}

function makeItem(poet: 'hafez' | 'rumi', index: number) {
  const id = sequenceId(poet, index);
  const isHafez = poet === 'hafez';

  return {
    id,
    schema_version: 2,
    status: 'approved',
    poet,
    mode: isHafez ? 'open_the_divan' : 'moment_of_reflection',
    display: {
      visual_variant: isHafez ? 'garden_night' : 'lamp_constellation',
      accent: isHafez ? 'pomegranate' : 'lapis',
    },
    source: {
      work_en: 'TEST ONLY / NOT POETRY / SYNTHETIC SOURCE LABEL',
      work_fa: 'TEST ONLY / NOT POETRY / SYNTHETIC SOURCE LABEL',
      edition_id: `test-only-${poet}-edition`,
      edition_citation: `TEST ONLY / NOT POETRY / ${poet} SYNTHETIC EDITION EVIDENCE`,
      edition_public_credit: `TEST ONLY / NOT POETRY / ${poet} SYNTHETIC EDITION CREDIT`,
      reference_type: isHafez ? 'ghazal' : 'masnavi',
      reference_value: `TEST ONLY REFERENCE ${String(index + 1)}`,
      opening_hemistich_fa: isHafez
        ? `TEST ONLY / NOT POETRY / OPENING LABEL ${String(index + 1)}`
        : null,
      page_reference: null,
      source_language: 'fa',
      english_source_id: `test-only-${poet}-english-source`,
      english_source_sha256: 'a'.repeat(64),
      english_source_reference: `TEST ONLY ENGLISH REFERENCE ${String(index + 1)}`,
      persian_source_sha256: 'b'.repeat(64),
    },
    text: {
      persian_lines: [
        `TEST ONLY / NOT POETRY / PERSIAN UNIT ${String(index + 1)} A`,
        `TEST ONLY / NOT POETRY / PERSIAN UNIT ${String(index + 1)} B`,
      ],
      english_lines: [
        `TEST ONLY / NOT TRANSLATION / ENGLISH UNIT ${String(index + 1)} A`,
        `TEST ONLY / NOT TRANSLATION / ENGLISH UNIT ${String(index + 1)} B`,
      ],
      alignment: 'line',
      mapping: [
        { english_index: 0, persian_indices: [0] },
        { english_index: 1, persian_indices: [1] },
      ],
    },
    translation: {
      classification: 'society_translation',
      translator_ids: ['test-only-translator'],
      rights_owner: 'TEST ONLY / SYNTHETIC RIGHTS OWNER',
      permission_record_id: `${id}-translation-permission`,
      public_credit: 'TEST ONLY / NOT TRANSLATION / SYNTHETIC CREDIT',
      permitted_uses: [...REQUIRED_PUBLIC_USES],
      moral_rights_notes: 'TEST ONLY / SYNTHETIC PRIVATE NOTE',
    },
    reflection: {
      english: TEST_ONLY_REFLECTION,
      reviewer_ids: ['test-only-cultural-reviewer'],
      disclaimer_profile: 'reflection_not_prediction',
    },
    audio: {
      enabled: false,
      asset_path: null as string | null,
      mime_type: null as string | null,
      performer_id: null as string | null,
      performer_public_credit: null as string | null,
      permission_record_id: null as string | null,
      duration_seconds: null as number | null,
    },
    review: {
      source_editor_ids: ['test-only-source-editor'],
      persian_literary_reviewer_ids: ['test-only-persian-reviewer'],
      english_editor_ids: ['test-only-english-editor'],
      cultural_reviewer_ids: ['test-only-cultural-reviewer'],
      rights_reviewer_ids: ['test-only-rights-reviewer'],
      approved_at: '2026-07-12',
      approval_record_id: `${id}-approval`,
    },
    review_authority: {
      kind: 'human',
      contributorIds: ['test-only-final-approver'],
      attestationHash: 'c'.repeat(64),
    },
  };
}

export function makeFixtureCorpus() {
  const items = [
    ...Array.from({ length: 24 }, (_, index) => makeItem('hafez', index)),
    ...Array.from({ length: 16 }, (_, index) => makeItem('rumi', index)),
  ];
  const audioItem = items[0];
  if (audioItem === undefined) {
    throw new Error(
      'The TEST ONLY corpus must contain its first synthetic item.',
    );
  }

  const audioSha256 = createHash('sha256')
    .update(TEST_ONLY_AUDIO_BYTES)
    .digest('hex');
  const audioPath = `audio/${audioItem.id}-${audioSha256.slice(0, 8)}.mp3`;

  audioItem.audio = {
    enabled: true,
    asset_path: audioPath,
    mime_type: 'audio/mpeg',
    performer_id: 'test-only-performer',
    performer_public_credit: 'TEST ONLY / SYNTHETIC PERFORMER CREDIT',
    permission_record_id: `${audioItem.id}-audio-permission`,
    duration_seconds: 30,
  };

  const corpus = {
    items,
    registries: {
      editions: {
        schema_version: 1,
        editions: (['hafez', 'rumi'] as const).map((poet) => ({
          id: `test-only-${poet}-edition`,
          status: 'active',
          poet,
          source_language: 'fa',
          citation: `TEST ONLY / NOT POETRY / ${poet} SYNTHETIC EDITION EVIDENCE`,
          public_credit: `TEST ONLY / NOT POETRY / ${poet} SYNTHETIC EDITION CREDIT`,
        })),
      },
      contributors: {
        schema_version: 1,
        contributors: [
          {
            id: 'test-only-translator',
            status: 'active',
            display_name: 'TEST ONLY / SYNTHETIC TRANSLATOR',
            roles: ['translator'],
          },
          {
            id: 'test-only-source-editor',
            status: 'active',
            display_name: 'TEST ONLY / SYNTHETIC SOURCE EDITOR',
            roles: ['source_editor'],
          },
          {
            id: 'test-only-persian-reviewer',
            status: 'active',
            display_name: 'TEST ONLY / SYNTHETIC PERSIAN REVIEWER',
            roles: ['persian_literary_reviewer'],
          },
          {
            id: 'test-only-english-editor',
            status: 'active',
            display_name: 'TEST ONLY / SYNTHETIC ENGLISH EDITOR',
            roles: ['english_editor'],
          },
          {
            id: 'test-only-cultural-reviewer',
            status: 'active',
            display_name: 'TEST ONLY / SYNTHETIC CULTURAL REVIEWER',
            roles: ['cultural_reviewer'],
          },
          {
            id: 'test-only-rights-reviewer',
            status: 'active',
            display_name: 'TEST ONLY / SYNTHETIC RIGHTS REVIEWER',
            roles: ['rights_reviewer'],
          },
          {
            id: 'test-only-final-approver',
            status: 'active',
            display_name: 'TEST ONLY / SYNTHETIC FINAL APPROVER',
            roles: ['final_approver'],
          },
          {
            id: 'test-only-performer',
            status: 'active',
            display_name: 'TEST ONLY / SYNTHETIC PERFORMER',
            roles: ['performer'],
          },
        ],
      },
      permissions: {
        schema_version: 1,
        permissions: [
          ...items.map((item) => ({
            id: item.translation.permission_record_id,
            status: 'active',
            kind: 'translation',
            subject_id: item.id,
            rights_owner: item.translation.rights_owner,
            evidence_reference: 'TEST ONLY / SYNTHETIC PERMISSION EVIDENCE',
            permitted_uses: [...REQUIRED_PUBLIC_USES],
            attribution: item.translation.public_credit,
            modification_permitted: true,
            territories: ['worldwide'],
            effective_on: '2000-01-01',
            expires_on: null as string | null,
          })),
          {
            id: `${audioItem.id}-audio-permission`,
            status: 'active',
            kind: 'audio',
            subject_id: `${audioItem.id}-audio-asset`,
            rights_owner: 'TEST ONLY / SYNTHETIC AUDIO RIGHTS OWNER',
            evidence_reference:
              'TEST ONLY / SYNTHETIC AUDIO PERMISSION EVIDENCE',
            permitted_uses: [...REQUIRED_PUBLIC_USES],
            attribution: 'TEST ONLY / SYNTHETIC PERFORMER CREDIT',
            modification_permitted: false,
            territories: ['worldwide'],
            effective_on: '2000-01-01',
            expires_on: null as string | null,
          },
        ],
      },
      approvals: {
        schema_version: 1,
        approvals: items.map((item) => ({
          id: item.review.approval_record_id,
          status: 'current',
          item_id: item.id,
          authoring_sha256: canonicalSha256(item),
          approved_by: 'test-only-final-approver',
          approved_at: item.review.approved_at,
        })),
      },
      assets: {
        schema_version: 1,
        assets: [
          {
            id: `${audioItem.id}-audio-asset`,
            status: 'active',
            kind: 'audio',
            path: audioPath,
            mime_type: 'audio/mpeg',
            sha256: audioSha256,
            bytes: TEST_ONLY_AUDIO_BYTES.byteLength,
            permission_record_id: `${audioItem.id}-audio-permission`,
            performer_id: 'test-only-performer',
            duration_seconds: 30,
          },
        ],
      },
    },
    assetFiles: [
      {
        path: audioPath,
        contents: TEST_ONLY_AUDIO_BYTES.slice(),
      },
    ],
  };

  return corpus;
}

export type FixtureCorpus = ReturnType<typeof makeFixtureCorpus>;

export function refreshFixtureApproval(
  corpus: FixtureCorpus,
  itemId: string,
): void {
  const item = corpus.items.find((candidate) => candidate.id === itemId);
  const approval = corpus.registries.approvals.approvals.find(
    (candidate) => candidate.item_id === itemId,
  );
  if (item === undefined || approval === undefined) {
    throw new Error(`Missing TEST ONLY item or approval for ${itemId}.`);
  }

  approval.authoring_sha256 = canonicalSha256(item);
}
