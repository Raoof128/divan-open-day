import type { EffectiveMotion } from '../accessibility/motion';

export type MediaClass = 'mobile' | 'desktop';

export type { EffectiveMotion };

export interface CinematicConditions {
  readonly effectiveMotion: EffectiveMotion;
  readonly saveData: boolean;
  readonly online: boolean;
  readonly mediaClass: MediaClass;
}

export interface CinematicPlan {
  readonly shouldLoadVideo: boolean;
  readonly posterPath: string;
  readonly backdropPath: string;
  readonly videoPath: string;
}

export const CINEMATIC_ASSETS = {
  mobile: {
    poster: '/images/divan-poster-mobile.webp',
    backdrop: '/images/divan-alcove-mobile.webp',
    video: '/video/divan-cinematic-mobile.mp4',
  },
  desktop: {
    poster: '/images/divan-poster-desktop.webp',
    backdrop: '/images/divan-alcove-desktop.webp',
    video: '/video/divan-cinematic-desktop.mp4',
  },
} as const;

const DESKTOP_MIN_WIDTH = 900;

export function resolveMediaClass(width: number, height: number): MediaClass {
  return height >= width || width < DESKTOP_MIN_WIDTH ? 'mobile' : 'desktop';
}

export function readSaveData(candidate: unknown): boolean {
  if (typeof candidate !== 'object' || candidate === null) {
    return false;
  }
  const connection = (candidate as { connection?: unknown }).connection;
  if (typeof connection !== 'object' || connection === null) {
    return false;
  }
  return (connection as { saveData?: unknown }).saveData === true;
}

export function resolveCinematicPlan(
  conditions: CinematicConditions,
): CinematicPlan {
  const assets = CINEMATIC_ASSETS[conditions.mediaClass];
  return {
    shouldLoadVideo:
      conditions.effectiveMotion === 'full' &&
      !conditions.saveData &&
      conditions.online,
    posterPath: assets.poster,
    backdropPath: assets.backdrop,
    videoPath: assets.video,
  };
}
