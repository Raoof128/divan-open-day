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
  return (
    <section
      className="scene reveal-scene"
      data-scene="revealing"
      data-motion={reducedMotion ? 'reduced' : 'full'}
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
