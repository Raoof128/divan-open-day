export const TEST_ONLY_REFLECTION =
  'TEST ONLY NOT INTERPRETATION. This synthetic fixture exists solely to exercise automated validation of minimum and maximum word counts. It contains neutral labels, ordinary filler terms, and explicit warnings. It is not poetry, not translation, not commentary, not advice, not prediction, and not approved content. No phrase identifies an author, source, culture, belief, event, person, or publication. Delete or replace this fixture before any production build.';

const BASE_AUTHORING_ITEM = {
  id: 'test-only-hafez-selection',
  schema_version: 2,
  status: 'approved',
  poet: 'hafez',
  mode: 'open_the_divan',
  display: {
    visual_variant: 'garden_night',
    accent: 'pomegranate',
  },
  source: {
    work_en: 'TEST ONLY NOT POETRY SOURCE TITLE',
    work_fa: 'TEST ONLY NOT POETRY SOURCE LABEL',
    edition_id: 'test-edition',
    edition_citation: 'TEST ONLY internal edition citation',
    edition_public_credit: 'TEST ONLY public edition credit',
    reference_type: 'ghazal',
    reference_value: 'TEST-REFERENCE-1',
    opening_hemistich_fa: 'TEST ONLY NOT POETRY OPENING IDENTIFIER' as string | null,
    page_reference: null as string | null,
    source_language: 'fa',
  },
  text: {
    persian_lines: [
      'TEST ONLY NOT POETRY PERSIAN UNIT ONE',
      'TEST ONLY NOT POETRY PERSIAN UNIT TWO',
    ],
    english_lines: [
      'TEST ONLY NOT TRANSLATION ENGLISH UNIT ONE',
      'TEST ONLY NOT TRANSLATION ENGLISH UNIT TWO',
    ],
    alignment: 'line',
  },
  translation: {
    classification: 'society_translation',
    translator_ids: ['test-translator'],
    rights_owner: 'TEST ONLY rights owner',
    permission_record_id: 'test-translation-permission',
    public_credit: 'TEST ONLY translation credit',
    permitted_uses: [
      'website_display',
      'downloadable_share_card',
      'event_print',
      'archival_hosting',
    ],
    moral_rights_notes: 'TEST ONLY private note' as string | null,
  },
  reflection: {
    english: TEST_ONLY_REFLECTION,
    reviewer_ids: ['test-cultural-reviewer'],
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
    source_editor_ids: ['test-source-editor'],
    persian_literary_reviewer_ids: ['test-persian-reviewer'],
    english_editor_ids: ['test-english-editor'],
    cultural_reviewer_ids: ['test-cultural-reviewer'],
    rights_reviewer_ids: ['test-rights-reviewer'],
    approved_at: '2026-07-12',
    approval_record_id: 'test-approval',
  },
};

export function makeAuthoringItem() {
  return structuredClone(BASE_AUTHORING_ITEM);
}

export function makeRumiAuthoringItem() {
  const item = makeAuthoringItem();
  item.id = 'test-only-rumi-selection';
  item.poet = 'rumi';
  item.mode = 'moment_of_reflection';
  item.display.visual_variant = 'lamp_constellation';
  item.display.accent = 'lapis';
  item.source.reference_type = 'masnavi';
  item.source.opening_hemistich_fa = null;
  return item;
}
