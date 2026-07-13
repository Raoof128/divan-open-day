import { RELEASE_ERROR_MESSAGE } from '../app/runtime';

export interface BlockingErrorSceneProps {
  readonly onRetry: () => void;
}

export function BlockingErrorScene({ onRetry }: BlockingErrorSceneProps) {
  return (
    <section className="scene" data-scene="error" role="alert">
      <h1 tabIndex={-1} data-focus-target="scene-heading">
        The experience could not finish loading.
      </h1>
      <p>{RELEASE_ERROR_MESSAGE}</p>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </section>
  );
}
