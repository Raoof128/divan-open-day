import type { Poet } from '../contracts/content';

export interface IntentionSceneProps {
  readonly poet: Poet;
  readonly onReveal: () => void;
}

export function IntentionScene({ poet, onReveal }: IntentionSceneProps) {
  const isHafez = poet === 'hafez';
  return (
    <section className="scene" data-scene="intention">
      <h1>{isHafez ? 'Take a quiet moment.' : 'Take one slow breath.'}</h1>
      <p>
        {isHafez
          ? 'Hold a question or hope in your mind. When you are ready, open the Divan.'
          : 'Hold a thought you would like to carry differently. When you are ready, reveal a passage.'}
      </p>
      <button type="button" onClick={onReveal}>
        Press to reveal
      </button>
      <p className="disclaimer">
        This is a literary reflection, not a prediction or a promise.
      </p>
    </section>
  );
}
