import { CinematicThreshold } from '../components/CinematicThreshold';
import { ManuscriptPortal } from '../components/ManuscriptPortal';
import type { EffectiveMotion } from '../lib/cinematic/capability';

export interface WelcomeSceneProps {
  readonly onBegin: () => void;
  readonly effectiveMotion: EffectiveMotion;
  readonly onAnnounce: (message: string) => void;
}

export function WelcomeScene({
  onBegin,
  effectiveMotion,
  onAnnounce,
}: WelcomeSceneProps) {
  return (
    <CinematicThreshold
      effectiveMotion={effectiveMotion}
      onArrive={onBegin}
      onAnnounce={onAnnounce}
    >
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
    </CinematicThreshold>
  );
}
