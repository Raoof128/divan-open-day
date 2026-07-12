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

  it('does not count punctuation-only tokens as reflection words', () => {
    const item = makeAuthoringItem();
    const actualWords = Array.from({ length: 44 }, (_, index) => `word${index}`);
    item.reflection.english = [...actualWords, '...', '---', '!!!'].join(' ');

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

  it.each([
    '*single emphasis*',
    '_single emphasis_',
    '[reference label][reference-id]',
    '[reference-id]: https://example.test/source',
    'TEST ONLY heading\n===',
    'TEST ONLY heading\n---',
    '    TEST ONLY indented code',
    '```text\nTEST ONLY fenced code\n```',
    '~~~text\nTEST ONLY fenced code\n~~~',
    '<!DOCTYPE html>',
    '<![CDATA[TEST ONLY declaration]]>',
    '<?xml version="1.0"?>',
  ])('rejects additional raw markup forms in authoring text: %s', (unsafeText) => {
    const item = makeAuthoringItem();
    item.text.english_lines[0] = unsafeText;

    expect(authoringContentItemSchema.safeParse(item).success).toBe(false);
  });

  it.each(['\u061C', '\u200E', '\u200F'])(
    'rejects unsafe bidi control U+%s in authoring text',
    (unsafeControl) => {
      const item = makeAuthoringItem();
      item.text.english_lines[0] = `TEST ONLY${unsafeControl}NOT TRANSLATION`;

      expect(authoringContentItemSchema.safeParse(item).success).toBe(false);
    },
  );

  it('requires equal Persian and English unit counts for stanza alignment', () => {
    const item = makeAuthoringItem();
    item.text.alignment = 'stanza';
    item.text.english_lines = ['TEST ONLY NOT TRANSLATION UNIT ONE'];

    const result = authoringContentItemSchema.safeParse(item);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.message ===
            'Persian and English unit arrays must have equal lengths for line or stanza alignment.',
        ),
      ).toBe(true);
    }
  });

  it('uses conspicuous neutral non-content fixture text', () => {
    const item = makeAuthoringItem();

    expect(
      item.text.persian_lines.every(
        (line) => line.includes('TEST ONLY') && line.includes('NOT POETRY'),
      ),
    ).toBe(true);
    expect(
      item.text.english_lines.every(
        (line) => line.includes('TEST ONLY') && line.includes('NOT TRANSLATION'),
      ),
    ).toBe(true);
    expect(item.reflection.english).toContain('TEST ONLY');
    expect(item.reflection.english).toContain('NOT INTERPRETATION');
    expect(item.reflection.english).not.toMatch(/garden|desire|symbol|verse/iu);
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
