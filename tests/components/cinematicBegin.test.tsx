import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CinematicThreshold } from '../../src/components/CinematicThreshold';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderThreshold(effectiveMotion: 'full' | 'reduced' = 'full') {
  const onArrive = vi.fn();
  const onAnnounce = vi.fn();
  render(
    <CinematicThreshold
      effectiveMotion={effectiveMotion}
      onArrive={onArrive}
      onAnnounce={onAnnounce}
    >
      <button type="button" data-cinematic-begin>
        Begin
      </button>
    </CinematicThreshold>,
  );
  return { onArrive, onAnnounce };
}

describe('cinematic Begin control', () => {
  it('smoothly traverses the scroll corridor instead of arriving immediately', () => {
    const { onArrive, onAnnounce } = renderThreshold();
    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    fireEvent(video!, new Event('loadeddata'));

    const section = document.querySelector('.cinematic-threshold');
    expect(section).not.toBeNull();
    Object.defineProperty(section!, 'offsetHeight', { value: 2600 });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });
    const scrollIntoView = vi.fn();
    Object.defineProperty(section!, 'scrollIntoView', {
      value: scrollIntoView,
      configurable: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end',
    });
    expect(onAnnounce).toHaveBeenCalledWith(
      'Entering the reading alcove.',
    );
    expect(onArrive).not.toHaveBeenCalled();
  });

  it('arrives directly when reduced motion disables the cinematic corridor', () => {
    const { onArrive } = renderThreshold('reduced');

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    expect(onArrive).toHaveBeenCalledTimes(1);
  });
});
