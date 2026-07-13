export const FOCUS_TARGETS = {
  begin: 'begin',
  heading: 'scene-heading',
  hafez: 'poet-hafez',
  rumi: 'poet-rumi',
  reveal: 'reveal',
} as const;

export type FocusTarget = (typeof FOCUS_TARGETS)[keyof typeof FOCUS_TARGETS];

export function focusMainRegion(mainId: string): boolean {
  const main = document.getElementById(mainId);
  if (!(main instanceof HTMLElement)) {
    return false;
  }
  main.focus();
  return document.activeElement === main;
}

export function focusSceneTarget(
  main: HTMLElement | null,
  target: FocusTarget,
): boolean {
  const element = main?.querySelector<HTMLElement>(
    `[data-focus-target="${target}"]`,
  );
  if (element === undefined || element === null) {
    return false;
  }
  element.focus();
  return document.activeElement === element;
}
