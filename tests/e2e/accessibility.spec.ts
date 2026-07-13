import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

interface FixtureRelease {
  readonly contentPath: string;
}

async function installFixtureRelease(page: Page): Promise<void> {
  const dist = path.resolve(process.cwd(), 'dist');
  const releaseBytes = await readFile(path.join(dist, 'release.json'));
  const release = JSON.parse(releaseBytes.toString('utf8')) as FixtureRelease;
  const corpusBytes = await readFile(
    path.join(dist, release.contentPath.replace(/^\//u, '')),
  );

  await page.route('**/release.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: releaseBytes,
    }),
  );
  await page.route(`**${release.contentPath}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: corpusBytes,
    }),
  );
}

async function expectNoBrowserAxeViolations(page: Page): Promise<void> {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(metrics.content).toBeLessThanOrEqual(metrics.viewport);
}

test.beforeEach(async ({ page }) => {
  await installFixtureRelease(page);
  await page.setViewportSize({ width: 320, height: 568 });
});

test('completes both poet flows by keyboard with semantic, reflow, and axe checks', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expectNoBrowserAxeViolations(page);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Begin' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Whose words will you open?',
  );
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: /Open the Divan.*Hafez/u }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Press to reveal' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { level: 1, name: 'Your verse' })).toBeFocused();
  const english = page.getByTestId('english-poem');
  const persian = page.getByTestId('persian-poem');
  await expect(persian).toHaveAttribute('lang', 'fa');
  await expect(persian).toHaveAttribute('dir', 'rtl');
  expect(
    await english.evaluate((element, other) =>
      Boolean(
        element.compareDocumentPosition(other as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    await persian.elementHandle()),
  ).toBe(true);
  expect(await page.locator('bdi').count()).toBeGreaterThanOrEqual(3);
  await expectNoHorizontalOverflow(page);
  await expectNoBrowserAxeViolations(page);

  await page.addStyleTag({
    content: `
      * {
        letter-spacing: 0.12em !important;
        line-height: 1.5 !important;
        word-spacing: 0.16em !important;
      }
      p { margin-block-end: 2em !important; }
    `,
  });
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole('button', { name: 'Reveal another' })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('button', { name: 'Press to reveal' })).toBeFocused();
  await page.goBack();
  await expect(
    page.getByRole('button', { name: /Open the Divan.*Hafez/u }),
  ).toBeFocused();

  await page.getByRole('button', { name: /A Moment of Reflection.*Rumi/u }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Your verse' })).toBeFocused();
  await expectNoBrowserAxeViolations(page);
});

test('honours motion precedence and preserves the result when native audio fails', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.crypto, 'getRandomValues', {
      configurable: true,
      value: <T extends ArrayBufferView | null>(target: T): T => {
        if (target !== null) {
          new Uint8Array(target.buffer, target.byteOffset, target.byteLength).fill(0);
        }
        return target;
      },
    });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByTestId('app-shell')).toHaveAttribute('data-motion', 'reduced');

  await page.getByRole('button', { name: 'Begin' }).click();
  await page.getByRole('button', { name: /Open the Divan.*Hafez/u }).click();
  await page.getByRole('button', { name: 'Press to reveal' }).click();
  const reducedReveal = page.locator('[data-scene="revealing"]');
  const opacityTransition = await reducedReveal.evaluate(async (element) => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const transition = element
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition &&
          animation.transitionProperty === 'opacity',
      );
    const effect = transition?.effect;
    const keyframes = effect instanceof KeyframeEffect ? effect.getKeyframes() : [];
    return {
      duration: effect?.getTiming().duration ?? null,
      startOpacity: keyframes.at(0)?.['opacity'] ?? null,
      endOpacity: keyframes.at(-1)?.['opacity'] ?? null,
    };
  });
  expect(opacityTransition).toEqual({
    duration: 120,
    startOpacity: '0',
    endOpacity: '1',
  });
  await expect(page.getByRole('heading', { level: 1, name: 'Your verse' })).toBeFocused();

  await page.evaluate(() => window.sessionStorage.clear());
  await page.reload();
  await page.getByLabel('Motion').selectOption('full');
  await expect(page.getByTestId('app-shell')).toHaveAttribute('data-motion', 'full');
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.getByRole('button', { name: /Open the Divan.*Hafez/u }).click();
  const reveal = page.getByRole('button', { name: 'Press to reveal' });
  await reveal.evaluate((button) => {
    button.addEventListener(
      'click',
      () => {
        document.documentElement.dataset['revealActivatedAt'] = String(
          performance.now(),
        );
      },
      { once: true },
    );
  });
  await reveal.click();
  const skip = page.getByRole('button', { name: 'Skip animation' });
  await expect(skip).toBeVisible();
  const skipElapsedMs = await page.evaluate(() => {
    const startedAt = Number(
      document.documentElement.dataset['revealActivatedAt'],
    );
    return performance.now() - startedAt;
  });
  expect(skipElapsedMs).toBeLessThanOrEqual(300);
  await skip.press('Enter');

  const audio = page.locator('audio[aria-label="Listen in Persian"]');
  await expect(audio).toHaveAttribute('controls', '');
  await expect(audio).toHaveAttribute('preload', 'metadata');
  await expect(audio).not.toHaveAttribute('autoplay', /.*/u);
  await audio.evaluate((element) => {
    element.dispatchEvent(new Event('error'));
  });
  await expect(page.getByText('Persian audio is unavailable right now.').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Your verse' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reveal another' })).toBeEnabled();
});
