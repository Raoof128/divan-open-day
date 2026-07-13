import type { Poet } from '../contracts/content';

export interface ChoosePoetSceneProps {
  readonly onChoose: (poet: Poet) => void;
}

export function ChoosePoetScene({ onChoose }: ChoosePoetSceneProps) {
  return (
    <section className="scene" data-scene="choose-poet">
      <h1>Whose words will you open?</h1>
      <div className="poet-options">
        <button type="button" data-poet="hafez" onClick={() => onChoose('hafez')}>
          <strong>Open the Divan</strong>
          <span>Hafez — A tradition-inspired reading from Hafez.</span>
          <span lang="fa" dir="rtl">
            فال حافظ
          </span>
        </button>
        <button type="button" data-poet="rumi" onClick={() => onChoose('rumi')}>
          <strong>A Moment of Reflection</strong>
          <span>Rumi — A passage from Rumi for contemplation.</span>
          <span lang="fa" dir="rtl">
            لحظه‌ای با مولانا
          </span>
        </button>
      </div>
    </section>
  );
}
