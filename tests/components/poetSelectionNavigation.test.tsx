import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PoemResult } from '../../src/components/PoemResult';
import { SESSION_STORAGE_KEYS } from '../../src/contracts/app';
import { IntentionScene } from '../../src/scenes/IntentionScene';
import { HAFEZ_ITEM } from './fixtures';

const CHOOSE_STATE = {
  stage: 'choose_poet',
  selectedPoet: null,
  releaseId: 'test-only-release',
} as const;

function seedSelectedFlow(stage: 'intention' | 'result'): void {
  window.history.replaceState(
    {
      stage,
      selectedPoet: 'hafez',
      releaseId: 'test-only-release',
    },
    '',
    '/',
  );
  window.sessionStorage.setItem(
    SESSION_STORAGE_KEYS.releaseId,
    'test-only-release',
  );
  window.sessionStorage.setItem(SESSION_STORAGE_KEYS.selectedPoet, 'hafez');
  window.sessionStorage.setItem(
    SESSION_STORAGE_KEYS.currentPoemId,
    HAFEZ_ITEM.id,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('visible poet-selection navigation', () => {
  it('returns from the intention card and clears stale selection state', () => {
    seedSelectedFlow('intention');
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate, { once: true });
    render(<IntentionScene poet="hafez" onReveal={vi.fn()} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Choose another poet' }),
    );

    expect(window.history.state).toEqual(CHOOSE_STATE);
    expect(popstate).toHaveBeenCalledTimes(1);
    expect(
      window.sessionStorage.getItem(SESSION_STORAGE_KEYS.selectedPoet),
    ).toBeNull();
    expect(
      window.sessionStorage.getItem(SESSION_STORAGE_KEYS.currentPoemId),
    ).toBeNull();
  });

  it('returns from a poem result without depending on browser-history depth', () => {
    seedSelectedFlow('result');
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate, { once: true });
    render(
      <PoemResult
        item={HAFEZ_ITEM}
        audioUnavailable={false}
        onAudioError={vi.fn()}
        onRevealAnother={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Choose another poet' }),
    );

    expect(window.history.state).toEqual(CHOOSE_STATE);
    expect(popstate).toHaveBeenCalledTimes(1);
    expect(
      window.sessionStorage.getItem(SESSION_STORAGE_KEYS.selectedPoet),
    ).toBeNull();
    expect(
      window.sessionStorage.getItem(SESSION_STORAGE_KEYS.currentPoemId),
    ).toBeNull();
  });
});
