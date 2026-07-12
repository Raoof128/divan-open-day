import type { Poet } from './content';

export const APP_STAGES = [
  'boot',
  'welcome',
  'choose_poet',
  'intention',
  'revealing',
  'result',
  'result_action',
] as const;
export type AppStage = (typeof APP_STAGES)[number];

export const MOTION_PREFERENCES = ['system', 'reduced', 'full'] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export interface DivanHistoryState {
  readonly stage: AppStage;
  readonly selectedPoet: Poet | null;
  readonly releaseId: string;
}

export const SESSION_STORAGE_KEYS = {
  releaseId: 'divan.releaseId',
  selectedPoet: 'divan.selectedPoet',
  hafezShuffle: 'divan.shuffle.hafez',
  rumiShuffle: 'divan.shuffle.rumi',
  currentPoemId: 'divan.currentPoemId',
  motionPreference: 'divan.motionPreference',
} as const;
