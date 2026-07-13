import { useEffect, useRef } from 'react';

import type { PublicContentItem } from '../contracts/content';
import { SourceCredit } from './SourceCredit';

export interface PoemResultProps {
  readonly item: PublicContentItem;
  readonly audioUnavailable: boolean;
  readonly onAudioError: () => void;
  readonly onRevealAnother: () => void;
}

export function PoemResult({
  item,
  audioUnavailable,
  onAudioError,
  onRevealAnother,
}: PoemResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <article className="poem-result">
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
          <audio
            aria-label="Listen in Persian"
            controls
            preload="metadata"
            onError={onAudioError}
          >
            <source src={`/${item.audio.assetPath}`} type={item.audio.mimeType} />
          </audio>
          <p>{item.audio.performerCredit}</p>
          {audioUnavailable ? (
            <p>Persian audio is unavailable right now.</p>
          ) : null}
        </section>
      )}

      <div className="result-actions" aria-label="Verse actions">
        <button type="button" onClick={onRevealAnother}>
          Reveal another
        </button>
      </div>
    </article>
  );
}
