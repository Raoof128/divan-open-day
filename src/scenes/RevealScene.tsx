import { useEffect, useState } from 'react';

import { DecorativeGeometry } from '../components/DecorativeGeometry';
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

  useEffect(() => {
    // Escape mirrors the visible "Skip animation" control; the shared
    // completion handler guards against running more than once.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  return (
    <section
      className="scene reveal-scene"
      data-scene="revealing"
      data-motion={reducedMotion ? 'reduced' : 'full'}
      data-reveal-phase={revealPhase}
      aria-busy="true"
    >
      <DecorativeGeometry motif="field" />
      <div className="reveal-object" aria-hidden="true">
        <div className="reveal-paper reveal-paper--back" />
        <div className="reveal-paper" />
        <div className="reveal-cover">
          <DecorativeGeometry
            className="reveal-ornament"
            motif={poet === 'hafez' ? 'pomegranate-cypress' : 'reed-rosette'}
          />
        </div>
      </div>
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
