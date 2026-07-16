import { DecorativeGeometry } from '../components/DecorativeGeometry';
import { FlowBackButton } from '../components/FlowBackButton';
import type { Poet } from '../contracts/content';

export interface IntentionSceneProps {
  readonly poet: Poet;
  readonly onReveal: () => void;
}

export function IntentionScene({ poet, onReveal }: IntentionSceneProps) {
  const isHafez = poet === 'hafez';
  return (
    <section
      className="scene scene--intention"
      data-scene="intention"
      data-visual-language={isHafez ? 'garden-night' : 'lamp-constellation'}
    >
      <DecorativeGeometry
        motif={isHafez ? 'pomegranate-cypress' : 'reed-rosette'}
      />
      <FlowBackButton />
      <h1 tabIndex={-1} data-focus-target="scene-heading">
        {isHafez ? 'Take a quiet moment.' : 'Take one slow breath.'}
      </h1>
      <p>
        {isHafez
          ? 'Hold a question or hope in your mind. When you are ready, open the Divan.'
          : 'Hold a thought you would like to carry differently. When you are ready, reveal a passage.'}
      </p>
      <button type="button" data-focus-target="reveal" onClick={onReveal}>
        Press to reveal
      </button>
      <p className="disclaimer">
        This is a cultural reflection experience. It does not predict outcomes
        and is not medical, legal, financial, religious or professional advice.
      </p>
    </section>
  );
}
