import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PoemResult, type ShareService } from '../../src/components/PoemResult';
import type { PublicContentItem } from '../../src/contracts/content';

const item: PublicContentItem = {
  id: 'hafez-0007',
  schemaVersion: 2,
  poet: 'hafez',
  mode: 'open_the_divan',
  display: { visualVariant: 'garden_night', accent: 'pomegranate' },
  source: {
    workEn: 'The Divan',
    workFa: 'دیوان',
    editionPublicCredit: 'Public edition credit',
    reference: 'Ghazal 7',
    openingHemistichFa: null,
  },
  text: {
    persianLines: ['خط فارسی'],
    englishLines: ['An English line'],
    alignment: 'line',
  },
  translationClassification: 'society_translation',
  translationCredit: 'Society translation',
  reflection: 'A reflection, not a prediction.',
  audio: null,
  contentHash: 'hash',
};

afterEach(cleanup);

function renderResult(
  shareService: ShareService,
  onAnnounce: (m: string) => void,
) {
  return render(
    <PoemResult
      item={item}
      audioUnavailable={false}
      onAudioError={() => undefined}
      onRevealAnother={() => undefined}
      shareService={shareService}
      onAnnounce={onAnnounce}
    />,
  );
}

describe('PoemResult share actions', () => {
  it('invokes the share service and announces the outcome through the app live region, keeping the verse visible', async () => {
    const shareService: ShareService = {
      shareVerse: vi.fn().mockResolvedValue('copied'),
      downloadShareCard: vi.fn(),
    };
    const onAnnounce = vi.fn();
    renderResult(shareService, onAnnounce);

    await userEvent.click(
      screen.getByRole('button', { name: 'Save this verse' }),
    );

    expect(shareService.shareVerse).toHaveBeenCalledOnce();
    expect(onAnnounce).toHaveBeenCalledWith(
      expect.stringMatching(/copied to your clipboard/iu),
    );
    // Verse remains visible after sharing.
    expect(screen.getByText('An English line')).toBeInTheDocument();
  });

  it('does not announce when the visitor cancels the share sheet', async () => {
    const shareService: ShareService = {
      shareVerse: vi.fn().mockResolvedValue('cancelled'),
      downloadShareCard: vi.fn(),
    };
    const onAnnounce = vi.fn();
    renderResult(shareService, onAnnounce);

    await userEvent.click(
      screen.getByRole('button', { name: 'Save this verse' }),
    );

    expect(onAnnounce).not.toHaveBeenCalled();
  });

  it('downloads a verse card on request', async () => {
    const shareService: ShareService = {
      shareVerse: vi.fn().mockResolvedValue('shared'),
      downloadShareCard: vi.fn(),
    };
    const onAnnounce = vi.fn();
    renderResult(shareService, onAnnounce);

    await userEvent.click(
      screen.getByRole('button', { name: 'Download verse card' }),
    );

    expect(shareService.downloadShareCard).toHaveBeenCalledOnce();
    expect(onAnnounce).toHaveBeenCalledWith(
      expect.stringMatching(/downloaded/iu),
    );
  });

  it('keeps the verse and reports gracefully if sharing throws', async () => {
    const shareService: ShareService = {
      shareVerse: vi.fn().mockRejectedValue(new Error('boom')),
      downloadShareCard: vi.fn(),
    };
    const onAnnounce = vi.fn();
    renderResult(shareService, onAnnounce);

    await userEvent.click(
      screen.getByRole('button', { name: 'Save this verse' }),
    );

    expect(onAnnounce).toHaveBeenCalledWith(
      expect.stringMatching(/unavailable/iu),
    );
    expect(screen.getByText('An English line')).toBeInTheDocument();
  });
});
