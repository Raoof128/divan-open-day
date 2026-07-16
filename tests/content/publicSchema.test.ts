import { describe, expect, it } from 'vitest';

import { canonicalSha256 } from '../../src/lib/content/canonical';
import { publicContentItemSchema } from '../../src/lib/content/publicSchema';
import { TEST_ONLY_REFLECTION } from './fixtures';

function makePublicPayload() {
  return {
    id: 'test-only-hafez-selection',
    schemaVersion: 2,
    poet: 'hafez',
    mode: 'open_the_divan',
    display: {
      visualVariant: 'garden_night',
      accent: 'pomegranate',
    },
    source: {
      workEn: 'TEST ONLY NOT POETRY SOURCE TITLE',
      workFa: 'TEST ONLY NOT POETRY SOURCE LABEL',
      editionPublicCredit: 'TEST ONLY public edition credit',
      reference: 'TEST-REFERENCE-1',
      openingHemistichFa: 'TEST ONLY NOT POETRY OPENING IDENTIFIER' as
        string | null,
    },
    text: {
      persianLines: [
        'TEST ONLY NOT POETRY PERSIAN UNIT ONE',
        'TEST ONLY NOT POETRY PERSIAN UNIT TWO',
      ],
      englishLines: [
        'TEST ONLY NOT TRANSLATION ENGLISH UNIT ONE',
        'TEST ONLY NOT TRANSLATION ENGLISH UNIT TWO',
      ],
      alignment: 'line',
    },
    translationClassification: 'society_translation',
    translationCredit: 'TEST ONLY translation credit',
    reflection: TEST_ONLY_REFLECTION,
    verificationStatus: 'HUMAN_ATTESTED',
    disclosures: [],
    audio: null as {
      assetPath: string;
      mimeType: string;
      durationSeconds: number;
      performerCredit: string;
    } | null,
  };
}

function withHash(payload: ReturnType<typeof makePublicPayload>) {
  return { ...payload, contentHash: canonicalSha256(payload) };
}

describe('publicContentItemSchema', () => {
  it('accepts a complete item with its canonical content hash', () => {
    expect(
      publicContentItemSchema.safeParse(withHash(makePublicPayload())).success,
    ).toBe(true);
  });

  it('rejects unknown private fields at top-level and nested boundaries', () => {
    const topLevelLeak = withHash(makePublicPayload());
    Object.assign(topLevelLeak, { reviewerIds: ['private-reviewer'] });

    const nestedLeak = withHash(makePublicPayload());
    Object.assign(nestedLeak.source, {
      permissionRecordId: 'private-permission',
    });

    const topResult = publicContentItemSchema.safeParse(topLevelLeak);
    const nestedResult = publicContentItemSchema.safeParse(nestedLeak);

    expect(topResult.success).toBe(false);
    expect(nestedResult.success).toBe(false);
    if (!topResult.success && !nestedResult.success) {
      expect(
        topResult.error.issues.some(
          (issue) => issue.code === 'unrecognized_keys',
        ),
      ).toBe(true);
      expect(
        nestedResult.error.issues.some(
          (issue) => issue.code === 'unrecognized_keys',
        ),
      ).toBe(true);
    }
  });

  it.each([
    ['hafez', 'moment_of_reflection'],
    ['rumi', 'open_the_divan'],
  ])('rejects the invalid %s and %s pairing', (poet, mode) => {
    const payload = makePublicPayload();
    payload.poet = poet;
    payload.mode = mode;

    expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(
      false,
    );
  });

  it('requires an opening hemistich for Hafez', () => {
    const payload = makePublicPayload();
    payload.source.openingHemistichFa = null;

    expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(
      false,
    );
  });

  it.each(['<em>raw HTML</em>', '**raw Markdown**'])(
    'rejects raw markup in public text: %s',
    (unsafeText) => {
      const payload = makePublicPayload();
      payload.text.englishLines[0] = unsafeText;

      expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(
        false,
      );
    },
  );

  it.each([
    '*single emphasis*',
    '_single emphasis_',
    '[reference label][reference-id]',
    '[reference-id]: https://example.test/source',
    'TEST ONLY heading\n===',
    'TEST ONLY heading\n---',
    '---',
    '_ _ _',
    '* * *',
    '    TEST ONLY indented code',
    '\tTEST ONLY tab-indented code',
    '```text\nTEST ONLY fenced code\n```',
    '~~~text\nTEST ONLY fenced code\n~~~',
    '<!DOCTYPE html>',
    '<![CDATA[TEST ONLY declaration]]>',
    '<?xml version="1.0"?>',
  ])('rejects additional raw markup forms in public text: %s', (unsafeText) => {
    const payload = makePublicPayload();
    payload.text.englishLines[0] = unsafeText;

    expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(
      false,
    );
  });

  it.each(['\u061C', '\u200E', '\u200F'])(
    'rejects unsafe bidi control U+%s in public text',
    (unsafeControl) => {
      const payload = makePublicPayload();
      payload.text.englishLines[0] = `TEST ONLY${unsafeControl}NOT TRANSLATION`;

      expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(
        false,
      );
    },
  );

  it('does not count punctuation-only tokens as public reflection words', () => {
    const payload = makePublicPayload();
    const actualWords = Array.from(
      { length: 44 },
      (_, index) => `word${index}`,
    );
    payload.reflection = [...actualWords, '...', '---', '!!!'].join(' ');

    expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(
      false,
    );
  });

  it('allows unequal public spans after private mapping validation', () => {
    const payload = makePublicPayload();
    payload.text.alignment = 'stanza';
    payload.text.persianLines = ['TEST ONLY NOT POETRY PERSIAN UNIT ONE'];

    const result = publicContentItemSchema.safeParse(withHash(payload));
    expect(result.success).toBe(true);
  });

  it('accepts valid local audio metadata', () => {
    const payload = makePublicPayload();
    payload.audio = {
      assetPath: 'audio/test-only-recitation.ogg',
      mimeType: 'audio/ogg',
      durationSeconds: 30,
      performerCredit: 'TEST ONLY performer credit',
    };

    expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(
      true,
    );
  });

  it.each(['https://example.test/recitation.mp3', 'audio/%2e%2e/private.mp3'])(
    'rejects remote or escaping public audio assets: %s',
    (assetPath) => {
      const payload = makePublicPayload();
      payload.audio = {
        assetPath,
        mimeType: 'audio/mpeg',
        durationSeconds: 30,
        performerCredit: 'TEST ONLY performer credit',
      };

      expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(
        false,
      );
    },
  );

  it('rejects a valid-looking but incorrect content hash', () => {
    const item = withHash(makePublicPayload());
    item.contentHash = '0'.repeat(64);

    expect(publicContentItemSchema.safeParse(item).success).toBe(false);
  });
});
