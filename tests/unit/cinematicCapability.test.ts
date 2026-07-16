import { describe, expect, it } from 'vitest';

import {
  CINEMATIC_ASSETS,
  resolveCinematicPlan,
  resolveMediaClass,
} from '../../src/lib/cinematic/capability';

describe('resolveMediaClass', () => {
  it('classes portrait phones as mobile', () => {
    expect(resolveMediaClass(390, 844)).toBe('mobile');
  });

  it('classes narrow landscape handsets as mobile', () => {
    expect(resolveMediaClass(844, 390)).toBe('mobile');
  });

  it('classes wide landscape viewports as desktop', () => {
    expect(resolveMediaClass(1440, 900)).toBe('desktop');
  });

  it('classes portrait tablets as mobile composition', () => {
    expect(resolveMediaClass(834, 1194)).toBe('mobile');
  });
});

describe('resolveCinematicPlan', () => {
  const capable = {
    effectiveMotion: 'full',
    saveData: false,
    online: true,
    mediaClass: 'mobile',
  } as const;

  it('loads the native mobile clip for capable mobile visitors', () => {
    const plan = resolveCinematicPlan(capable);
    expect(plan.shouldLoadVideo).toBe(true);
    expect(plan.videoPath).toBe(CINEMATIC_ASSETS.mobile.video);
    expect(plan.posterPath).toBe(CINEMATIC_ASSETS.mobile.poster);
    expect(plan.backdropPath).toBe(CINEMATIC_ASSETS.mobile.backdrop);
  });

  it('loads the native desktop clip for capable desktop visitors', () => {
    const plan = resolveCinematicPlan({ ...capable, mediaClass: 'desktop' });
    expect(plan.videoPath).toBe(CINEMATIC_ASSETS.desktop.video);
  });

  it('never fetches video under reduced motion', () => {
    const plan = resolveCinematicPlan({
      ...capable,
      effectiveMotion: 'reduced',
    });
    expect(plan.shouldLoadVideo).toBe(false);
    expect(plan.posterPath).toBe(CINEMATIC_ASSETS.mobile.poster);
  });

  it('never fetches video under Save-Data', () => {
    expect(resolveCinematicPlan({ ...capable, saveData: true })).toMatchObject({
      shouldLoadVideo: false,
    });
  });

  it('never fetches video offline, keeping the poster route', () => {
    const plan = resolveCinematicPlan({ ...capable, online: false });
    expect(plan.shouldLoadVideo).toBe(false);
    expect(plan.posterPath).toBe(CINEMATIC_ASSETS.mobile.poster);
    expect(plan.backdropPath).toBe(CINEMATIC_ASSETS.mobile.backdrop);
  });
});
