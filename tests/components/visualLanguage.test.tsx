import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { App } from '../../src/app/App';
import { makeVerifiedRelease } from './fixtures';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.sessionStorage.clear();
  window.localStorage.clear();
});

afterEach(() => cleanup());

it('uses safe hidden original geometry and culturally distinct poet portals', async () => {
  const { container } = render(
    <App
      services={{ loadRelease: () => Promise.resolve(makeVerifiedRelease()) }}
    />,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Begin' }));

  const hafez = screen.getByRole('button', { name: /Open the Divan.*Hafez/u });
  const rumi = screen.getByRole('button', {
    name: /A Moment of Reflection.*Rumi/u,
  });
  expect(hafez).toHaveAttribute('data-visual-language', 'garden-night');
  expect(rumi).toHaveAttribute('data-visual-language', 'lamp-constellation');
  expect(
    hafez.querySelector('[data-motif="pomegranate-cypress"]'),
  ).not.toBeNull();
  expect(rumi.querySelector('[data-motif="reed-rosette"]')).not.toBeNull();

  const decorativeSvgs = [
    ...container.querySelectorAll('svg[data-divan-geometry]'),
  ];
  expect(decorativeSvgs.length).toBeGreaterThanOrEqual(2);
  for (const svg of decorativeSvgs) {
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg.querySelector('script, use')).toBeNull();
    expect(
      [...svg.attributes].some((attribute) => /^on/u.test(attribute.name)),
    ).toBe(false);
    expect(svg).toHaveAttribute('width');
    expect(svg).toHaveAttribute('height');
  }
});

it('registers every repository-authored motif without a third-party artwork claim', async () => {
  const register = await readFile(
    resolve(process.cwd(), 'docs/asset-register.md'),
    'utf8',
  );
  for (const id of [
    'divan-eight-point-field',
    'divan-manuscript-corners',
    'divan-pomegranate-cypress',
    'divan-reed-rosette',
  ]) {
    expect(register).toContain(id);
  }
  expect(register).toContain(
    'No runtime font request leaves the built origin.',
  );
});
