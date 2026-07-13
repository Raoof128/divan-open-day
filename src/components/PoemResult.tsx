import { useEffect, useMemo, useRef, useState } from 'react';

import type { PublicContentItem } from '../contracts/content';
import { DEFAULT_SHARE_CONFIG, type ShareConfig } from '../lib/share/shareCard';
import {
  type ShareOutcome,
  downloadShareCard as defaultDownloadShareCard,
  shareVerse as defaultShareVerse,
} from '../lib/share/shareService';
import { IlluminatedFrame } from './IlluminatedFrame';
import { SourceCredit } from './SourceCredit';

export interface ShareService {
  readonly shareVerse: typeof defaultShareVerse;
  readonly downloadShareCard: typeof defaultDownloadShareCard;
}

const DEFAULT_SHARE_SERVICE: ShareService = {
  shareVerse: defaultShareVerse,
  downloadShareCard: defaultDownloadShareCard,
};

const SHARE_MESSAGES: Record<ShareOutcome, string | null> = {
  shared: 'Verse shared.',
  copied: 'Verse text copied to your clipboard.',
  cancelled: null,
  'copy-unavailable':
    'Sharing is not available in this browser. You can select and copy the verse text.',
};

export interface PoemResultProps {
  readonly item: PublicContentItem;
  readonly audioUnavailable: boolean;
  readonly onAudioError: () => void;
  readonly onRevealAnother: () => void;
  readonly shareService?: ShareService;
  /** Announce share outcomes through the app's single polite live region. */
  readonly onAnnounce?: (message: string) => void;
}

export function PoemResult({
  item,
  audioUnavailable,
  onAudioError,
  onRevealAnother,
  shareService = DEFAULT_SHARE_SERVICE,
  onAnnounce,
}: PoemResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [stallInvitationOpen, setStallInvitationOpen] = useState(false);

  const shareConfig = useMemo<ShareConfig>(
    () => ({
      siteUrl: typeof window === 'undefined' ? '' : window.location.origin,
      society: DEFAULT_SHARE_CONFIG.society,
    }),
    [],
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function announce(message: string | null): void {
    if (message !== null) {
      onAnnounce?.(message);
    }
  }

  async function handleSaveVerse(): Promise<void> {
    try {
      const outcome = await shareService.shareVerse(item, shareConfig);
      announce(SHARE_MESSAGES[outcome]);
    } catch {
      announce(
        'Sharing is unavailable right now. The verse is still here for you.',
      );
    }
  }

  function handleDownloadCard(): void {
    try {
      shareService.downloadShareCard(item, shareConfig);
      announce('Verse card downloaded.');
    } catch {
      announce(
        'The verse card could not be created. The verse is still here for you.',
      );
    }
  }

  return (
    <article
      className="poem-result"
      data-visual-language={
        item.poet === 'hafez' ? 'garden-night' : 'lamp-constellation'
      }
    >
      <IlluminatedFrame>
        <section data-testid="english-poem" aria-labelledby="result-heading">
          <h1 id="result-heading" ref={headingRef} tabIndex={-1}>
            Your verse
          </h1>
          <div className="poem-lines">
            {item.text.englishLines.map((line, index) => (
              <p key={`${item.id}-en-${String(index)}`}>{line}</p>
            ))}
          </div>
        </section>

        <section
          data-testid="persian-poem"
          lang="fa"
          dir="rtl"
          aria-labelledby="persian-heading"
        >
          <h2 id="persian-heading">متن فارسی</h2>
          <div className="poem-lines">
            {item.text.persianLines.map((line, index) => (
              <p key={`${item.id}-fa-${String(index)}`}>{line}</p>
            ))}
          </div>
        </section>

        <section aria-labelledby="reflection-heading">
          <h2 id="reflection-heading">A reflection, not a prediction</h2>
          <p>{item.reflection}</p>
        </section>

        <SourceCredit item={item} />

        {item.audio === null ? null : (
          <section aria-labelledby="audio-heading">
            <h2 id="audio-heading">Listen in Persian</h2>
            {audioUnavailable ? (
              <p>Persian audio is unavailable right now.</p>
            ) : (
              <>
                <audio
                  aria-label="Listen in Persian"
                  controls
                  preload="metadata"
                  onError={onAudioError}
                >
                  <source
                    src={`/${item.audio.assetPath}`}
                    type={item.audio.mimeType}
                  />
                </audio>
                <p>{item.audio.performerCredit}</p>
              </>
            )}
          </section>
        )}

        <div className="result-actions" role="group" aria-label="Verse actions">
          <button type="button" onClick={onRevealAnother}>
            Reveal another
          </button>
          <button type="button" onClick={() => void handleSaveVerse()}>
            Save this verse
          </button>
          <button type="button" onClick={handleDownloadCard}>
            Download verse card
          </button>
          <button
            type="button"
            aria-expanded={stallInvitationOpen}
            aria-controls="stall-invitation"
            onClick={() => setStallInvitationOpen((open) => !open)}
          >
            Return to the stall
          </button>
        </div>

        <p
          id="stall-invitation"
          className="context-note"
          hidden={!stallInvitationOpen}
        >
          Come and say hello at the Persian Society stall — we’d love to hear
          which verse you drew. A volunteer there can help you reveal another
          verse.
        </p>

        <nav className="context-links" aria-label="Learn more">
          <a href="/about">Learn about the poet</a>
        </nav>
      </IlluminatedFrame>
    </article>
  );
}
