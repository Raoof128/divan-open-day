import { expect, test, type Page } from '@playwright/test';

const RELEASE_ONE = 'test-only-fixture-release';
const RELEASE_TWO = 'test-only-fixture-release-two';
const POINTER_CACHE = 'divan-release-pointers-v2';
const POINTER_PATH = '/__divan/release-pointer-v2';

async function selectRelease(page: Page, release: 'one' | 'two' | 'broken') {
  const response = await page.request.post(`/__test/release/${release}`);
  expect(response.status()).toBe(204);
}

async function activeRelease(page: Page): Promise<string | null> {
  return page.evaluate(
    async ({ cacheName, pointerPath }) => {
      const names = await caches.keys();
      if (!names.includes(cacheName)) return null;
      const response = await (await caches.open(cacheName)).match(pointerPath);
      if (response === undefined) return null;
      const pointer = (await response.json()) as { activeReleaseId?: unknown };
      return typeof pointer.activeReleaseId === 'string'
        ? pointer.activeReleaseId
        : null;
    },
    { cacheName: POINTER_CACHE, pointerPath: POINTER_PATH },
  );
}

async function waitForActive(page: Page, releaseId: string): Promise<void> {
  await expect
    .poll(() => activeRelease(page), { timeout: 15_000 })
    .toBe(releaseId);
}

async function updateRegistration(
  page: Page,
): Promise<'installed' | 'redundant' | 'none'> {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration === undefined) {
      throw new Error('The service-worker registration is missing.');
    }
    await registration.update().catch(() => undefined);
    const worker = registration.installing;
    if (worker === null) {
      return 'none';
    }
    if (worker.state === 'installed' || worker.state === 'redundant') {
      return worker.state;
    }
    return new Promise<'installed' | 'redundant'>((resolve, reject) => {
      const timeout = window.setTimeout(
        () => reject(new Error('Service-worker installation timed out.')),
        15_000,
      );
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' || worker.state === 'redundant') {
          window.clearTimeout(timeout);
          resolve(worker.state);
        }
      });
    });
  });
}

test('keeps one coherent verified release through outage, update failure, and rollback', async ({
  context,
  page,
}) => {
  await selectRelease(page, 'one');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await waitForActive(page, RELEASE_ONE);

  const compressed = await page.request.get('/release.json', {
    headers: { 'accept-encoding': 'gzip' },
  });
  expect(compressed.status()).toBe(200);
  expect(compressed.headers()['content-encoding']).toBe('gzip');

  const cachedPaths = await page.evaluate(async () => {
    const paths: string[] = [];
    for (const name of await caches.keys()) {
      if (!name.startsWith('divan-release-v2:')) continue;
      for (const request of await (await caches.open(name)).keys()) {
        paths.push(new URL(request.url).pathname);
      }
    }
    return paths;
  });
  expect(cachedPaths.some((pathname) => pathname.startsWith('/audio/'))).toBe(
    false,
  );

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
  await expect(
    page.evaluate(() =>
      fetch('/healthz')
        .then(() => 'unexpected response')
        .catch(() => 'network failed'),
    ),
  ).resolves.toBe('network failed');
  await context.setOffline(false);

  await selectRelease(page, 'two');
  await expect(updateRegistration(page)).resolves.toBe('installed');
  await expect(
    page.getByRole('button', { name: 'Apply offline update' }),
  ).toBeVisible({ timeout: 15_000 });
  expect(await activeRelease(page)).toBe(RELEASE_ONE);

  // A real clean navigation activates only the persisted current target.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
  await waitForActive(page, RELEASE_TWO);
  const applyCurrentWorker = page.getByRole('button', {
    name: 'Apply offline update',
  });
  if (await applyCurrentWorker.isVisible()) {
    await Promise.all([
      page.waitForEvent('framenavigated'),
      applyCurrentWorker.click(),
    ]);
    await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
    await waitForActive(page, RELEASE_TWO);
  }

  await selectRelease(page, 'broken');
  await expect(updateRegistration(page)).resolves.toBe('redundant');
  expect(await activeRelease(page)).toBe(RELEASE_TWO);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
  await context.setOffline(false);

  await selectRelease(page, 'one');
  await expect(updateRegistration(page)).resolves.toBe('installed');
  const rollback = page.getByRole('button', { name: 'Apply offline update' });
  await expect(rollback).toBeVisible({ timeout: 15_000 });
  await Promise.all([page.waitForEvent('framenavigated'), rollback.click()]);
  await waitForActive(page, RELEASE_ONE);
  await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();

  const pointer = await page.evaluate(
    async ({ cacheName, pointerPath }) => {
      const response = await (await caches.open(cacheName)).match(pointerPath);
      return (await response?.json()) as {
        activeReleaseId: string;
        previousReleaseId: string | null;
      };
    },
    { cacheName: POINTER_CACHE, pointerPath: POINTER_PATH },
  );
  expect(pointer).toEqual({
    activeReleaseId: RELEASE_ONE,
    previousReleaseId: RELEASE_TWO,
  });
});
