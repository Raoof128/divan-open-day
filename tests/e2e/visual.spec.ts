import { expect, test, type Page, type Route } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

interface FixtureRelease {
  readonly contentPath: string;
}

const BASELINES = [
  { name: 'phone-320x568', width: 320, height: 568 },
  { name: 'phone-390x844', width: 390, height: 844 },
  { name: 'landscape-844x390', width: 844, height: 390 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
] as const;

const CONTEXT_PAGES = [
  ['/about', 'about'],
  ['/credits', 'credits'],
  ['/accessibility', 'accessibility'],
  ['/privacy', 'privacy'],
  ['/offline', 'offline'],
] as const;

async function installFixtureRelease(page: Page): Promise<{
  pauseRelease: () => {
    readonly firstRequest: Promise<void>;
    readonly resume: () => Promise<void>;
  };
  releaseBytes: Buffer;
}> {
  const dist = resolve(process.cwd(), 'dist');
  const releaseBytes = await readFile(resolve(dist, 'release.json'));
  const release = JSON.parse(releaseBytes.toString('utf8')) as FixtureRelease;
  const corpusBytes = await readFile(
    resolve(dist, release.contentPath.replace(/^\//u, '')),
  );

  // The visual matrix asserts layout via Playwright route interception. The
  // offline service worker (exercised separately by offline.spec.ts) would
  // serve the cached release and bypass those routes, so it is disabled for
  // this capture run; the app registers it fail-safe, so this is a no-op path.
  await page.addInitScript(() => {
    const container = navigator.serviceWorker as
      { register?: unknown } | undefined;
    if (container && typeof container.register === 'function') {
      Object.defineProperty(container, 'register', {
        configurable: true,
        value: () =>
          Promise.reject(
            new Error('service worker disabled for visual capture'),
          ),
      });
    }
  });

  let releasePaused = false;
  let pausedRoutes: Route[] = [];
  let resolveFirstRequest: (() => void) | null = null;

  await page.route('**/release.json', (route) => {
    if (releasePaused) {
      pausedRoutes.push(route);
      resolveFirstRequest?.();
      resolveFirstRequest = null;
      return;
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: releaseBytes,
    });
  });
  await page.route(`**${release.contentPath}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: corpusBytes,
    }),
  );
  return {
    pauseRelease: () => {
      releasePaused = true;
      const firstRequest = new Promise<void>((resolveRequest) => {
        resolveFirstRequest = resolveRequest;
      });
      return {
        firstRequest,
        resume: async () => {
          releasePaused = false;
          const routes = pausedRoutes;
          pausedRoutes = [];
          await Promise.all(
            routes.map((route) =>
              route.fulfill({
                status: 200,
                contentType: 'application/json; charset=utf-8',
                body: releaseBytes,
              }),
            ),
          );
        },
      };
    },
    releaseBytes,
  };
}

async function capture(page: Page, path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const overflow = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
  await page.screenshot({
    path,
    fullPage: true,
    type: 'jpeg',
    quality: 72,
  });
}

test('captures the locked visual matrix without remote resources or overflow', async ({
  page,
}, testInfo) => {
  const remoteRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') {
      remoteRequests.push(request.url());
    }
  });
  const { pauseRelease } = await installFixtureRelease(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('divan.motionPreference', 'reduced');
  });

  for (const [index, baseline] of BASELINES.entries()) {
    await page.setViewportSize({
      width: baseline.width,
      height: baseline.height,
    });
    if (index > 0) {
      await page.goto('/about');
      await page.evaluate(() => window.sessionStorage.clear());
    }
    const pausedRelease = pauseRelease();
    await page.goto('/');
    await pausedRelease.firstRequest;
    await expect(
      page.getByRole('heading', { level: 1, name: 'DIVAN' }),
    ).toBeVisible();
    await capture(
      page,
      testInfo.outputPath('visual-evidence', baseline.name, '00-boot.jpg'),
    );
    await pausedRelease.resume();

    await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
    await capture(
      page,
      testInfo.outputPath('visual-evidence', baseline.name, '01-welcome.jpg'),
    );

    await page.getByRole('button', { name: 'Begin' }).click();
    await capture(
      page,
      testInfo.outputPath('visual-evidence', baseline.name, '02-choose.jpg'),
    );

    const hafez = page.getByRole('button', { name: /Open the Divan.*Hafez/u });
    const rumi = page.getByRole('button', {
      name: /A Moment of Reflection.*Rumi/u,
    });
    const hafezBackground = await hafez.evaluate(
      (element) => getComputedStyle(element, '::before').backgroundImage,
    );
    const rumiBackground = await rumi.evaluate(
      (element) => getComputedStyle(element, '::before').backgroundImage,
    );
    expect(hafezBackground).not.toBe(rumiBackground);

    await hafez.click();
    await capture(
      page,
      testInfo.outputPath(
        'visual-evidence',
        baseline.name,
        '03-hafez-intention.jpg',
      ),
    );
    await page.getByLabel('Motion').selectOption('full');
    await page.getByRole('button', { name: 'Press to reveal' }).click();
    const hafezSkip = page.getByRole('button', { name: 'Skip animation' });
    await expect(hafezSkip).toBeVisible();
    await capture(
      page,
      testInfo.outputPath(
        'visual-evidence',
        baseline.name,
        '04-hafez-revealing.jpg',
      ),
    );
    await hafezSkip.click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your verse' }),
    ).toBeFocused();
    await capture(
      page,
      testInfo.outputPath(
        'visual-evidence',
        baseline.name,
        '05-hafez-result.jpg',
      ),
    );

    await page.goBack();
    await page.goBack();
    await page
      .getByRole('button', { name: /A Moment of Reflection.*Rumi/u })
      .click();
    await capture(
      page,
      testInfo.outputPath(
        'visual-evidence',
        baseline.name,
        '06-rumi-intention.jpg',
      ),
    );
    await page.getByRole('button', { name: 'Press to reveal' }).click();
    const rumiSkip = page.getByRole('button', { name: 'Skip animation' });
    await expect(rumiSkip).toBeVisible();
    await capture(
      page,
      testInfo.outputPath(
        'visual-evidence',
        baseline.name,
        '07-rumi-revealing.jpg',
      ),
    );
    await rumiSkip.click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your verse' }),
    ).toBeFocused();
    await capture(
      page,
      testInfo.outputPath(
        'visual-evidence',
        baseline.name,
        '08-rumi-result.jpg',
      ),
    );

    for (const [route, name] of CONTEXT_PAGES) {
      await page.goto(route);
      await capture(
        page,
        testInfo.outputPath(
          'visual-evidence',
          baseline.name,
          `context-${name}.jpg`,
        ),
      );
    }
  }

  const dimensionlessDecorativeSvg = await page
    .locator('svg[data-divan-geometry]')
    .evaluateAll(
      (elements) =>
        elements.filter(
          (element) =>
            !element.hasAttribute('width') || !element.hasAttribute('height'),
        ).length,
    );
  expect(dimensionlessDecorativeSvg).toBe(0);
  expect(remoteRequests).toEqual([]);
});

test('full reveal uses bounded composited choreography and reduced mode stays static', async ({
  page,
}) => {
  const { pauseRelease } = await installFixtureRelease(page);
  const pausedRelease = pauseRelease();
  await page.goto('/');
  await pausedRelease.firstRequest;
  await pausedRelease.resume();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.getByRole('button', { name: /Open the Divan.*Hafez/u }).click();
  await page.getByLabel('Motion').selectOption('full');
  await page.getByRole('button', { name: 'Press to reveal' }).click();
  await expect(page.locator('.reveal-object')).toBeVisible();

  const fullAnimations = await page
    .locator('.reveal-object')
    .evaluate((element) =>
      element.getAnimations({ subtree: true }).map((animation) => {
        const effect = animation.effect;
        const keyframes =
          effect instanceof KeyframeEffect ? effect.getKeyframes() : [];
        return {
          duration: Number(effect?.getTiming().duration ?? 0),
          properties: [
            ...new Set(keyframes.flatMap((frame) => Object.keys(frame))),
          ].filter(
            (property) =>
              !['composite', 'computedOffset', 'easing', 'offset'].includes(
                property,
              ),
          ),
        };
      }),
    );
  expect(fullAnimations.length).toBeGreaterThanOrEqual(2);
  expect(
    Math.max(...fullAnimations.map((animation) => animation.duration)),
  ).toBeLessThanOrEqual(1_600);
  for (const animation of fullAnimations) {
    expect(
      animation.properties.every((property) =>
        ['opacity', 'strokeDashoffset', 'transform'].includes(property),
      ),
    ).toBe(true);
  }

  await page.getByRole('button', { name: 'Skip animation' }).click();
  await page.getByRole('button', { name: 'Reveal another' }).click();
  await page.getByLabel('Motion').selectOption('reduced');
  await page.getByRole('button', { name: 'Press to reveal' }).click();
  await expect(page.locator('[data-scene="revealing"]')).toHaveAttribute(
    'data-motion',
    'reduced',
  );
  const reducedAnimations = await page
    .locator('.reveal-object')
    .evaluate(
      (element) =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation instanceof CSSAnimation).length,
    );
  expect(reducedAnimations).toBe(0);
});
