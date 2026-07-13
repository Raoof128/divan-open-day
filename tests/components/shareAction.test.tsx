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

describe('PoemResult secondary context actions (§7.6)', () => {
  function renderWithDefaults(): void {
    renderResult(
      {
        shareVerse: vi.fn().mockResolvedValue('shared'),
        downloadShareCard: vi.fn(),
      },
      vi.fn(),
    );
  }

  it('offers a "Learn about the poet" link to the About page after the primary action', () => {
    renderWithDefaults();

    const learnLink = screen.getByRole('link', {
      name: 'Learn about the poet',
    });
    expect(learnLink).toHaveAttribute('href', '/about');

    const actions = document.querySelector('.result-actions');
    expect(actions).not.toBeNull();
    const firstButton = actions?.querySelector('button');
    expect(firstButton).toHaveTextContent('Reveal another');
    expect(
      (actions as Element).compareDocumentPosition(learnLink) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('discloses a generic Society stall invitation without any location or tracking detail', async () => {
    renderWithDefaults();

    const toggle = screen.getByRole('button', { name: 'Return to the stall' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const panelId = toggle.getAttribute('aria-controls');
    expect(panelId).not.toBeNull();
    const panel = document.getElementById(panelId ?? '');
    expect(panel).not.toBeNull();
    expect(panel).not.toBeVisible();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toBeVisible();
    const invitation = panel?.textContent ?? '';
    expect(invitation).toMatch(/Persian Society stall/u);
    expect(invitation).toMatch(/volunteer/iu);
    // Generic invitation only: no stall number, room, map, or coordinates.
    expect(invitation).not.toMatch(/\d/u);
    expect(invitation).not.toMatch(
      /map|location|room|building|floor|geolocation|gps/iu,
    );
    // The primary action still leads the row.
    expect(
      screen.getByRole('button', { name: 'Reveal another' }),
    ).toBeEnabled();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toBeVisible();
  });
});
