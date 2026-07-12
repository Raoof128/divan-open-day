import { describe, expect, it } from 'vitest';

import { authoringContentItemSchema } from '../../src/lib/content/authoringSchema';
import { makeAuthoringItem, makeRumiAuthoringItem } from './fixtures';

describe('authoringContentItemSchema', () => {
  it('accepts complete Hafez and Rumi authoring records', () => {
    expect(authoringContentItemSchema.safeParse(makeAuthoringItem()).success).toBe(
      true,
    );
    expect(
      authoringContentItemSchema.safeParse(makeRumiAuthoringItem()).success,
    ).toBe(true);
  });

  it('rejects unknown fields at every object boundary', () => {
    const topLevelLeak = makeAuthoringItem();
    Object.assign(topLevelLeak, { unexpected_private_field: 'leak' });

    const nestedLeak = makeAuthoringItem();
    Object.assign(nestedLeak.translation, { internal_note: 'leak' });

    expect(authoringContentItemSchema.safeParse(topLevelLeak).success).toBe(false);
    expect(authoringContentItemSchema.safeParse(nestedLeak).success).toBe(false);
  });

  it.each([
    ['hafez', 'moment_of_reflection'],
    ['rumi', 'open_the_divan'],
  ])('rejects the invalid %s and %s pairing', (poet, mode) => {
    const item = makeAuthoringItem();
    item.poet = poet;
    item.mode = mode;

    expect(authoringContentItemSchema.safeParse(item).success).toBe(false);
  });

  it('requires an edition reference and opening hemistich for Hafez', () => {
    const missingReference = makeAuthoringItem();
    missingReference.source.reference_value = '';

    const missingOpening = makeAuthoringItem();
    missingOpening.source.opening_hemistich_fa = null;

    expect(authoringContentItemSchema.safeParse(missingReference).success).toBe(
      false,
    );
    expect(authoringContentItemSchema.safeParse(missingOpening).success).toBe(
      false,
    );
  });

  it('requires two to six non-empty lines and aligned line translations', () => {
    const tooShort = makeAuthoringItem();
    tooShort.text.persian_lines = ['فقط یک سطر'];

    const misaligned = makeAuthoringItem();
    misaligned.text.english_lines = ['TEST ONLY one line'];

    expect(authoringContentItemSchema.safeParse(tooShort).success).toBe(false);
    expect(authoringContentItemSchema.safeParse(misaligned).success).toBe(false);
  });

  it('requires a 45 to 90 word reflection', () => {
    const item = makeAuthoringItem();
    item.reflection.english = 'Too short to be a reviewed reflection.';

    expect(authoringContentItemSchema.safeParse(item).success).toBe(false);
  });

  it.each([
    '<strong>raw HTML</strong>',
    '**raw Markdown**',
    '[remote label](https://example.test)',
  ])('rejects raw markup in text fields: %s', (unsafeText) => {
    const item = makeAuthoringItem();
    item.text.english_lines[0] = unsafeText;

    expect(authoringContentItemSchema.safeParse(item).success).toBe(false);
  });

  it('requires every publication use and every review role', () => {
    const missingUse = makeAuthoringItem();
    missingUse.translation.permitted_uses = ['website_display'];

    const missingReviewer = makeAuthoringItem();
    missingReviewer.review.rights_reviewer_ids = [];

    expect(authoringContentItemSchema.safeParse(missingUse).success).toBe(false);
    expect(authoringContentItemSchema.safeParse(missingReviewer).success).toBe(
      false,
    );
  });

  it('rejects approval performed only by the translator', () => {
    const item = makeAuthoringItem();
    const translatorId = item.translation.translator_ids[0] ?? '';
    item.review.source_editor_ids = [translatorId];
    item.review.persian_literary_reviewer_ids = [translatorId];
    item.review.english_editor_ids = [translatorId];
    item.review.cultural_reviewer_ids = [translatorId];
    item.review.rights_reviewer_ids = [translatorId];
    item.reflection.reviewer_ids = [translatorId];

    expect(authoringContentItemSchema.safeParse(item).success).toBe(false);
  });

  it('accepts complete local audio metadata', () => {
    const item = makeAuthoringItem();
    item.audio = {
      enabled: true,
      asset_path: 'audio/test-only-recitation.mp3',
      mime_type: 'audio/mpeg',
      performer_id: 'test-performer',
      performer_public_credit: 'TEST ONLY performer credit',
      permission_record_id: 'test-audio-permission',
      duration_seconds: 30,
    };

    expect(authoringContentItemSchema.safeParse(item).success).toBe(true);
  });

  it.each([
    'https://example.test/audio.mp3',
    '//example.test/audio.mp3',
    '../audio/test.mp3',
    '/audio/test.mp3',
    'audio/%2e%2e/private.mp3',
  ])('rejects remote or escaping audio paths: %s', (assetPath) => {
    const item = makeAuthoringItem();
    item.audio = {
      enabled: true,
      asset_path: assetPath,
      mime_type: 'audio/mpeg',
      performer_id: 'test-performer',
      performer_public_credit: 'TEST ONLY performer credit',
      permission_record_id: 'test-audio-permission',
      duration_seconds: 30,
    };

    expect(authoringContentItemSchema.safeParse(item).success).toBe(false);
  });

  it('requires permission and matching MIME metadata when audio is enabled', () => {
    const item = makeAuthoringItem();
    item.audio = {
      enabled: true,
      asset_path: 'audio/test-only-recitation.ogg',
      mime_type: 'audio/mpeg',
      performer_id: 'test-performer',
      performer_public_credit: 'TEST ONLY performer credit',
      permission_record_id: null,
      duration_seconds: 30,
    };

    expect(authoringContentItemSchema.safeParse(item).success).toBe(false);
  });

  it('rejects an impossible approval calendar date', () => {
    const item = makeAuthoringItem();
    item.review.approved_at = '2026-99-99';

    expect(authoringContentItemSchema.safeParse(item).success).toBe(false);
  });
});
