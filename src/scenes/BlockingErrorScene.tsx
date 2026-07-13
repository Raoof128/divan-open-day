import { RELEASE_ERROR_MESSAGE } from '../app/runtime';
import { IlluminatedFrame } from '../components/IlluminatedFrame';

export interface BlockingErrorSceneProps {
  readonly onRetry: () => void;
}

export function BlockingErrorScene({ onRetry }: BlockingErrorSceneProps) {
  return (
    <section className="scene error-scene" data-scene="error" role="alert">
      <IlluminatedFrame>
        <h1 tabIndex={-1} data-focus-target="scene-heading">
          The experience could not finish loading.
        </h1>
        <p>{RELEASE_ERROR_MESSAGE}</p>
        <button className="blocking-action" type="button" onClick={onRetry}>
          Try again
        </button>
      </IlluminatedFrame>
    </section>
  );
}
