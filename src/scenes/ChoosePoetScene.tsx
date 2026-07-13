import { DecorativeGeometry } from '../components/DecorativeGeometry';
import type { Poet } from '../contracts/content';

export interface ChoosePoetSceneProps {
  readonly onChoose: (poet: Poet) => void;
}

export function ChoosePoetScene({ onChoose }: ChoosePoetSceneProps) {
  return (
    <section className="scene scene--choose" data-scene="choose-poet">
      <DecorativeGeometry motif="field" />
      <h1 tabIndex={-1} data-focus-target="scene-heading">
        Whose words will you open?
      </h1>
      <div className="poet-options">
        <button
          type="button"
          data-poet="hafez"
          data-visual-language="garden-night"
          data-focus-target="poet-hafez"
          onClick={() => onChoose('hafez')}
        >
          <DecorativeGeometry motif="pomegranate-cypress" />
          <strong>Open the Divan</strong>
          <span>Hafez — A tradition-inspired reading.</span>
          <span className="poet-label-fa" lang="fa" dir="rtl">
            فال حافظ
          </span>
        </button>
        <button
          type="button"
          data-poet="rumi"
          data-visual-language="lamp-constellation"
          data-focus-target="poet-rumi"
          onClick={() => onChoose('rumi')}
        >
          <DecorativeGeometry motif="reed-rosette" />
          <strong>A Moment of Reflection</strong>
          <span>Rumi — A passage from Rumi for contemplation.</span>
          <span className="poet-label-fa" lang="fa" dir="rtl">
            لحظه‌ای با مولانا
          </span>
        </button>
      </div>
    </section>
  );
}
