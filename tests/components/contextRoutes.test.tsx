import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App } from '../../src/app/App';
import { makeVerifiedRelease } from './fixtures';

const loadRelease = () => Promise.resolve(makeVerifiedRelease());

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.sessionStorage.clear();
  window.localStorage.clear();
});

afterEach(() => cleanup());

describe.each([
  ['/about', 'About this experience'],
  ['/credits', 'Credits and sources'],
  ['/accessibility', 'Accessibility'],
  ['/privacy', 'Privacy'],
  ['/offline', 'When you are offline'],
] as const)('%s context route', (path, heading) => {
  it('renders one useful document view with return navigation', async () => {
    window.history.replaceState(null, '', path);
    render(<App services={{ loadRelease }} />);

    expect(
      await screen.findByRole('heading', { level: 1, name: heading }),
    ).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('main')).toBeVisible();
    expect(
      screen.getByRole('link', { name: /return to the poetry experience/i }),
    ).toHaveAttribute('href', '/');
  });
});

it('states the exact local storage boundary without inventing cache readiness', async () => {
  window.history.replaceState(null, '', '/privacy');
  render(<App services={{ loadRelease }} />);

  await screen.findByRole('heading', { level: 1, name: 'Privacy' });
  for (const key of [
    'divan.releaseId',
    'divan.selectedPoet',
    'divan.shuffle.hafez',
    'divan.shuffle.rumi',
    'divan.currentPoemId',
    'divan.motionPreference',
  ]) {
    expect(screen.getByText(key, { exact: true })).toBeVisible();
  }
  expect(document.body).toHaveTextContent(
    'This notice does not claim that caching is active on this device',
  );
  expect(document.body).toHaveTextContent(
    'offline readiness must come from the verified application state',
  );
  expect(document.body).not.toHaveTextContent('No service worker is active');
  expect(document.body).not.toHaveTextContent('zero provider logging');
});

it('offers offline recovery without pretending to know connection or cache state', async () => {
  window.history.replaceState(null, '', '/offline');
  render(<App services={{ loadRelease }} />);

  await screen.findByRole('heading', {
    level: 1,
    name: 'When you are offline',
  });
  expect(document.body).toHaveTextContent(
    'This page cannot confirm network status',
  );
  expect(document.body).toHaveTextContent(
    'This page does not infer network status or claim that caching is active',
  );
  expect(document.body).not.toHaveTextContent('You are offline');
  expect(document.body).not.toHaveTextContent('Ready offline');
});

it('derives fixture release metadata and public credits without presenting them as production', async () => {
  window.history.replaceState(null, '', '/credits');
  render(<App services={{ loadRelease }} />);

  await screen.findByRole('heading', { level: 1, name: 'Credits and sources' });
  expect(screen.getByText('test-only-release', { exact: true })).toBeVisible();
  expect(
    screen.getByText('TEST ONLY public edition credit', { exact: true }),
  ).toBeVisible();
  expect(
    screen.getByText('TEST ONLY Society translation', { exact: true }),
  ).toBeVisible();
  expect(screen.getByText(/non-production fixture release/i)).toBeVisible();
  expect(document.body).not.toHaveTextContent('Macquarie University');
});

it('credits the Macquarie Persian Society without using a University mark', async () => {
  window.history.replaceState(null, '', '/credits');
  render(<App services={{ loadRelease }} />);

  await screen.findByRole('heading', { level: 1, name: 'Credits and sources' });
  expect(
    screen.getByText(/made by the Macquarie Persian Society/iu),
  ).toBeVisible();
  expect(screen.getByText(/with love, for everyone/iu)).toBeVisible();
  // The society's own name is attribution; the unapproved University mark
  // (the exact phrase and any endorsement claim) must stay absent.
  expect(document.body).not.toHaveTextContent('Macquarie University');
});

it('carries the society credit on the About page as well', async () => {
  window.history.replaceState(null, '', '/about');
  render(<App services={{ loadRelease }} />);

  await screen.findByRole('heading', {
    level: 1,
    name: 'About this experience',
  });
  expect(
    screen.getByText(/made by the Macquarie Persian Society/iu),
  ).toBeVisible();
  expect(document.body).not.toHaveTextContent('Macquarie University');
});
