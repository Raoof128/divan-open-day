import type { MotionPreference } from '../../contracts/app';

export type EffectiveMotion = 'reduced' | 'full';

export const REVEAL_DURATION_MS = {
  reduced: 150,
  full: 1_600,
} as const satisfies Readonly<Record<EffectiveMotion, number>>;

export function resolveEffectiveMotion(
  preference: MotionPreference,
  systemPrefersReduced: boolean,
): EffectiveMotion {
  if (preference === 'reduced') {
    return 'reduced';
  }
  if (preference === 'full') {
    return 'full';
  }
  return systemPrefersReduced ? 'reduced' : 'full';
}

export function readSystemReducedMotion(
  matchMedia: typeof window.matchMedia | undefined,
): boolean {
  if (matchMedia === undefined) {
    return false;
  }
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function subscribeToSystemReducedMotion(
  matchMedia: typeof window.matchMedia | undefined,
  onChange: (matches: boolean) => void,
): () => void {
  if (matchMedia === undefined) {
    return () => undefined;
  }
  try {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (event: MediaQueryListEvent) => onChange(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  } catch {
    return () => undefined;
  }
}
