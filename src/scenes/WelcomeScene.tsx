import { DecorativeGeometry } from '../components/DecorativeGeometry';
import { ManuscriptPortal } from '../components/ManuscriptPortal';

export interface WelcomeSceneProps {
  readonly onBegin: () => void;
}

export function WelcomeScene({ onBegin }: WelcomeSceneProps) {
  return (
    <section className="scene scene--welcome" data-scene="welcome">
      <DecorativeGeometry motif="field" />
      <ManuscriptPortal>
        <h1 tabIndex={-1} data-focus-target="scene-heading">
          A verse is waiting for you.
        </h1>
        <p className="welcome-persian" lang="fa" dir="rtl">
          بیتی در انتظار توست
        </p>
        <p>
          Step into a living tradition of Persian poetry. Choose a poet, hold a
          thought in your mind, and reveal a verse.
        </p>
        <button
          className="primary-action"
          type="button"
          data-focus-target="begin"
          onClick={onBegin}
        >
          Begin
        </button>
        <nav aria-label="Experience information">
          <a href="/about">About this experience</a>
          <a href="/accessibility">Accessibility and motion</a>
          <a href="/credits">Credits</a>
        </nav>
      </ManuscriptPortal>
    </section>
  );
}
