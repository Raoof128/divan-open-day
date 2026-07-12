import { describe, expect, it } from 'vitest';

import { canonicalSha256 } from '../../src/lib/content/canonical';
import { publicContentItemSchema } from '../../src/lib/content/publicSchema';
import { REVIEWED_REFLECTION } from './fixtures';

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
      workEn: 'TEST ONLY Divan of Hafez',
      workFa: 'نسخه آزمایشی',
      editionPublicCredit: 'TEST ONLY public edition credit',
      reference: 'TEST-REFERENCE-1',
      openingHemistichFa: 'آغاز آزمایشی' as string | null,
    },
    text: {
      persianLines: ['سطر آزمایشی نخست', 'سطر آزمایشی دوم'],
      englishLines: ['TEST ONLY first line', 'TEST ONLY second line'],
      alignment: 'line',
    },
    translationClassification: 'society_translation',
    translationCredit: 'TEST ONLY translation credit',
    reflection: REVIEWED_REFLECTION,
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
    expect(publicContentItemSchema.safeParse(withHash(makePublicPayload())).success).toBe(
      true,
    );
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
      expect(topResult.error.issues.some((issue) => issue.code === 'unrecognized_keys')).toBe(
        true,
      );
      expect(
        nestedResult.error.issues.some((issue) => issue.code === 'unrecognized_keys'),
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

    expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(false);
  });

  it('requires an opening hemistich for Hafez', () => {
    const payload = makePublicPayload();
    payload.source.openingHemistichFa = null;

    expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(false);
  });

  it.each(['<em>raw HTML</em>', '**raw Markdown**']) (
    'rejects raw markup in public text: %s',
    (unsafeText) => {
      const payload = makePublicPayload();
      payload.text.englishLines[0] = unsafeText;

      expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(false);
    },
  );

  it('accepts valid local audio metadata', () => {
    const payload = makePublicPayload();
    payload.audio = {
      assetPath: 'audio/test-only-recitation.ogg',
      mimeType: 'audio/ogg',
      durationSeconds: 30,
      performerCredit: 'TEST ONLY performer credit',
    };

    expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(true);
  });

  it.each([
    'https://example.test/recitation.mp3',
    'audio/%2e%2e/private.mp3',
  ])('rejects remote or escaping public audio assets: %s', (assetPath) => {
    const payload = makePublicPayload();
    payload.audio = {
      assetPath,
      mimeType: 'audio/mpeg',
      durationSeconds: 30,
      performerCredit: 'TEST ONLY performer credit',
    };

    expect(publicContentItemSchema.safeParse(withHash(payload)).success).toBe(false);
  });

  it('rejects a valid-looking but incorrect content hash', () => {
    const item = withHash(makePublicPayload());
    item.contentHash = '0'.repeat(64);

    expect(publicContentItemSchema.safeParse(item).success).toBe(false);
  });
});
