import { describe, expect, it } from 'vitest';

import type { PublicContentItem } from '../../src/contracts/content';
import { compileItem } from '../../src/lib/content/compileItem';
import { publicContentItemSchema } from '../../src/lib/content/publicSchema';
import { makeAuthoringItem, makeRumiAuthoringItem } from './fixtures';

describe('compileItem', () => {
  it('constructs an allowlisted public item with a verified content hash', () => {
    const compiled: PublicContentItem = compileItem(makeAuthoringItem());

    expect(Object.keys(compiled).sort()).toEqual(
      [
        'audio',
        'contentHash',
        'display',
        'id',
        'mode',
        'poet',
        'reflection',
        'schemaVersion',
        'source',
        'text',
        'translationClassification',
        'translationCredit',
      ].sort(),
    );
    expect(Object.keys(compiled.source).sort()).toEqual(
      [
        'editionPublicCredit',
        'openingHemistichFa',
        'reference',
        'workEn',
        'workFa',
      ].sort(),
    );
    expect(publicContentItemSchema.safeParse(compiled).success).toBe(true);
  });

  it('does not emit private IDs, citations, notes, permissions, or review records', () => {
    const serialized = JSON.stringify(compileItem(makeAuthoringItem()));

    expect(serialized).not.toContain('test-translator');
    expect(serialized).not.toContain('TEST ONLY internal edition citation');
    expect(serialized).not.toContain('test-translation-permission');
    expect(serialized).not.toContain('TEST ONLY private note');
    expect(serialized).not.toContain('test-source-editor');
    expect(serialized).not.toContain('test-approval');
    expect(serialized).not.toContain('rights_owner');
    expect(serialized).not.toContain('permission_record_id');
    expect(serialized).not.toContain('reviewer_ids');
  });

  it('rejects records that have not reached approved status', () => {
    const draft = makeAuthoringItem();
    draft.status = 'draft';

    expect(() => compileItem(draft)).toThrow(/approved/u);
  });

  it('compiles a valid Rumi record without inventing an opening hemistich', () => {
    const compiled = compileItem(makeRumiAuthoringItem());

    expect(compiled.poet).toBe('rumi');
    expect(compiled.mode).toBe('moment_of_reflection');
    expect(compiled.source.openingHemistichFa).toBeNull();
    expect(publicContentItemSchema.safeParse(compiled).success).toBe(true);
  });

  it('emits only public audio credit and delivery metadata', () => {
    const item = makeAuthoringItem();
    item.audio = {
      enabled: true,
      asset_path: 'audio/test-only-recitation.mp3',
      mime_type: 'audio/mpeg',
      performer_id: 'test-private-performer-id',
      performer_public_credit: 'TEST ONLY performer credit',
      permission_record_id: 'test-private-audio-permission',
      duration_seconds: 30,
    };

    const compiled = compileItem(item);
    const serialized = JSON.stringify(compiled);

    expect(compiled.audio).toEqual({
      assetPath: 'audio/test-only-recitation.mp3',
      mimeType: 'audio/mpeg',
      durationSeconds: 30,
      performerCredit: 'TEST ONLY performer credit',
    });
    expect(serialized).not.toContain('test-private-performer-id');
    expect(serialized).not.toContain('test-private-audio-permission');
  });
});
