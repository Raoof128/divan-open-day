import { useMemo } from 'react';

import {
  resolveCinematicPlan,
  resolveMediaClass,
} from '../lib/cinematic/capability';
import { ButterflyField } from './ButterflyField';
import { CandleScene } from './CandleScene';
import { PoetryMotes } from './PoetryMotes';

// The stage backdrop is the actual final rendered frame of the cinematic
// clip, so arriving from the threshold lands on an identical composition.
export function BookStage() {
  const backdropPath = useMemo(
    () =>
      resolveCinematicPlan({
        effectiveMotion: 'reduced',
        saveData: true,
        online: false,
        mediaClass: resolveMediaClass(window.innerWidth, window.innerHeight),
      }).backdropPath,
    [],
  );

  return (
    <div className="book-stage" aria-hidden="true">
      <img
        className="book-stage__backdrop"
        src={backdropPath}
        alt=""
        decoding="async"
      />
      <div className="book-stage__scrim" />
      <CandleScene />
      <ButterflyField />
      <PoetryMotes />
    </div>
  );
}
