import { describe, expect, it, vi } from 'vitest';

import type { PublicContentItem } from '../../src/contracts/content';
import {
  downloadShareCard,
  shareVerse,
} from '../../src/lib/share/shareService';

const item: PublicContentItem = {
  id: 'rumi-0001',
  schemaVersion: 2,
  poet: 'rumi',
  mode: 'moment_of_reflection',
  display: { visualVariant: 'lamp_constellation', accent: 'lapis' },
  source: {
    workEn: 'Masnavi',
    workFa: 'مثنوی',
    editionPublicCredit: 'Public edition credit',
    reference: 'Book 1, lines 1-2',
    openingHemistichFa: 'بشنو این نی',
  },
  text: {
    persianLines: ['خط فارسی'],
    englishLines: ['Listen to the reed'],
    alignment: 'line',
  },
  translationClassification: 'society_translation',
  translationCredit: 'Society translation',
  reflection: 'A reflection.',
  audio: null,
  contentHash: 'def456',
};

const config = {
  siteUrl: 'https://example.test/divan',
  society: 'Test Society',
};

describe('shareVerse', () => {
  it('uses the Web Share API when available and permitted', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    const outcome = await shareVerse(item, config, {
      nav: { share, canShare, clipboard: undefined },
    });
    expect(outcome).toBe('shared');
    expect(share).toHaveBeenCalledOnce();
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(
          'Listen to the reed',
        ) as unknown as string,
      }),
    );
    const payload = share.mock.calls[0]?.[0] as { text: string };
    expect(payload.text).not.toContain('A reflection.');
  });

  it('falls back to clipboard copy when Web Share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareVerse(item, config, {
      nav: { share: undefined, canShare: undefined, clipboard: { writeText } },
    });
    expect(outcome).toBe('copied');
    expect(writeText).toHaveBeenCalledOnce();
  });

  it('reports copy-unavailable when neither share nor clipboard exist', async () => {
    const outcome = await shareVerse(item, config, {
      nav: { share: undefined, canShare: undefined, clipboard: undefined },
    });
    expect(outcome).toBe('copy-unavailable');
  });

  it('falls back to clipboard when Web Share rejects (not an abort)', async () => {
    const share = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareVerse(item, config, {
      nav: { share, canShare: () => true, clipboard: { writeText } },
    });
    expect(outcome).toBe('copied');
  });

  it('treats a user AbortError as a benign cancellation', async () => {
    const abort = new Error('cancelled');
    abort.name = 'AbortError';
    const share = vi.fn().mockRejectedValue(abort);
    const writeText = vi.fn();
    const outcome = await shareVerse(item, config, {
      nav: { share, canShare: () => true, clipboard: { writeText } },
    });
    expect(outcome).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe('downloadShareCard', () => {
  it('creates and revokes a Blob URL exactly once and triggers a download', () => {
    const createUrl = vi.fn().mockReturnValue('blob:mock');
    const revokeUrl = vi.fn();
    const triggerDownload = vi.fn();
    downloadShareCard(item, config, { createUrl, revokeUrl, triggerDownload });
    expect(createUrl).toHaveBeenCalledOnce();
    expect(triggerDownload).toHaveBeenCalledWith(
      'blob:mock',
      expect.stringMatching(/\.svg$/u),
    );
    expect(revokeUrl).toHaveBeenCalledWith('blob:mock');
  });
});
