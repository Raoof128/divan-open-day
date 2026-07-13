import { useEffect, useState } from 'react';

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
  const [revealPhase, setRevealPhase] = useState<'entering' | 'visible'>(
    reducedMotion ? 'entering' : 'visible',
  );

  useEffect(() => {
    if (!reducedMotion) {
      return;
    }
    // Waiting for a paint gives the browser two distinct opacity values to
    // interpolate; a transition declaration alone never creates motion.
    const frame = window.requestAnimationFrame(() => setRevealPhase('visible'));
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion]);

  return (
    <section
      className="scene reveal-scene"
      data-scene="revealing"
      data-motion={reducedMotion ? 'reduced' : 'full'}
      data-reveal-phase={revealPhase}
      aria-busy="true"
    >
      <h1 tabIndex={-1} data-focus-target="scene-heading">
        {poet === 'hafez' ? 'Opening the Divan' : 'Revealing a passage'}
      </h1>
      <p>Revealing your verse.</p>
      {showSkip ? (
        <button type="button" onClick={onSkip}>
          Skip animation
        </button>
      ) : null}
    </section>
  );
}
