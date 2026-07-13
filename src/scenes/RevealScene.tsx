import { useEffect, useRef } from 'react';

import type { Poet } from '../contracts/content';

export interface RevealSceneProps {
  readonly poet: Poet;
  readonly reducedMotion: boolean;
  readonly showSkip: boolean;
  readonly onSkip: () => void;
}

export function RevealScene({
  poet,
  reducedMotion,
  showSkip,
  onSkip,
}: RevealSceneProps) {
  const skipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showSkip) {
      skipRef.current?.focus();
    }
  }, [showSkip]);

  return (
    <section
      className="scene reveal-scene"
      data-scene="revealing"
      data-motion={reducedMotion ? 'reduced' : 'full'}
      aria-busy="true"
    >
      <h1>{poet === 'hafez' ? 'Opening the Divan' : 'Revealing a passage'}</h1>
      <p>Revealing your verse.</p>
      {showSkip ? (
        <button ref={skipRef} type="button" onClick={onSkip}>
          Skip animation
        </button>
      ) : null}
    </section>
  );
}
