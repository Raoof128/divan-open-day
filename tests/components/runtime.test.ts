import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { canonicalSha256 } from '../../src/lib/content/canonical';
import {
  loadVerifiedRelease,
  RELEASE_ERROR_MESSAGE,
  ReleaseLoadError,
} from '../../src/app/runtime';
import type { PublicContentItem } from '../../src/contracts/content';
import type { ReleaseDescriptor } from '../../src/contracts/release';
import { publicContentItemSchema } from '../../src/lib/content/publicSchema';

const RELEASE_ID = 'test-only-release';
const SHA_PLACEHOLDER = 'a'.repeat(64);

function makeItem(
  overrides: Partial<PublicContentItem> = {},
): PublicContentItem {
  const payload = {
    id: 'hafez-one',
    schemaVersion: 2 as const,
    poet: 'hafez' as const,
    mode: 'open_the_divan' as const,
    display: {
      visualVariant: 'garden_night' as const,
      accent: 'pomegranate' as const,
    },
    source: {
      workEn: 'The Divan of Hafez',
      workFa: 'دیوان حافظ',
      editionPublicCredit: 'TEST ONLY reviewed public edition credit',
      reference: 'Ghazal 1',
      openingHemistichFa: 'الا یا ایها الساقی',
    },
    text: {
      persianLines: ['الا یا ایها الساقی', 'ادر کاسا و ناولها'],
      englishLines: ['Cupbearer, pass the cup', 'And let it travel onward'],
      alignment: 'line' as const,
    },
    translationClassification: 'society_translation' as const,
    translationCredit: 'TEST ONLY Society translation',
    reflection:
      'Pause with the movement in these lines and notice what asks to be carried forward. The verse does not predict an outcome or decide a path for you. It offers a reviewed literary image that you may hold beside your own question, hope, or uncertainty with patience, care, and room for another interpretation.',
    audio: null,
  };

  return {
    ...payload,
    contentHash: canonicalSha256(payload),
    ...overrides,
  };
}

function rehashItem(item: PublicContentItem): PublicContentItem {
  const { contentHash, ...payload } = item;
  void contentHash;
  return { ...payload, contentHash: canonicalSha256(payload) };
}

function itemWithCredit(translationCredit: string): PublicContentItem {
  return rehashItem({ ...makeItem(), translationCredit });
}

const BUILD_RUNTIME_PARITY_CASES: readonly (readonly [
  string,
  PublicContentItem,
])[] = [
  ['block heading Markdown', itemWithCredit('# TEST ONLY credit')],
  ['horizontal-rule Markdown', itemWithCredit('TEST ONLY\n***\ncredit')],
  ['inline-link Markdown', itemWithCredit('TEST ONLY [credit](local)')],
  ['reference-link Markdown', itemWithCredit('TEST ONLY [credit][ref]')],
  ['reference-definition Markdown', itemWithCredit('TEST ONLY\n[ref]: local')],
  ['setext-heading Markdown', itemWithCredit('TEST ONLY credit\n===')],
  ['fenced-code Markdown', itemWithCredit('TEST ONLY\n```text')],
  ['asterisk-emphasis Markdown', itemWithCredit('TEST ONLY *credit*')],
  ['underscore-emphasis Markdown', itemWithCredit('TEST ONLY _credit_')],
  ['strong Markdown', itemWithCredit('TEST ONLY **credit**')],
  [
    'an empty audio path segment',
    rehashItem({
      ...makeItem(),
      audio: {
        assetPath: 'audio//file.mp3',
        mimeType: 'audio/mpeg',
        durationSeconds: 24,
        performerCredit: 'TEST ONLY reciter',
      },
    }),
  ],
];

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function makeReleaseFixture(
  items: readonly PublicContentItem[] = [makeItem()],
): {
  readonly release: ReleaseDescriptor;
  readonly corpusJson: string;
} {
  const corpusJson = JSON.stringify({
    schemaVersion: 2,
    releaseId: RELEASE_ID,
    items,
  });
  const contentSha256 = sha256(corpusJson);
  return {
    release: {
      releaseId: RELEASE_ID,
      schemaVersion: 2,
      builtAt: '2026-07-13T00:00:00.000Z',
      buildProfile: 'fixture',
      productionEligible: false,
      itemCount: items.length,
      hafezCount: items.filter((item) => item.poet === 'hafez').length,
      rumiCount: items.filter((item) => item.poet === 'rumi').length,
      contentPath: `/content/${contentSha256}.json`,
      contentSha256,
      assetManifestPath: `/assets/${SHA_PLACEHOLDER}.json`,
      assetManifestSha256: SHA_PLACEHOLDER,
    },
    corpusJson,
  };
}

function createFixtureFetch(
  release: unknown,
  corpusJson: string,
): {
  readonly fetch: typeof fetch;
  readonly calls: readonly {
    readonly input: string;
    readonly cache: RequestCache | undefined;
    readonly redirect: RequestRedirect | undefined;
  }[];
} {
  const calls: {
    input: string;
    cache: RequestCache | undefined;
    redirect: RequestRedirect | undefined;
  }[] = [];
  const fixtureFetch = ((input: string | URL | Request, init?: RequestInit) => {
    const path =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.pathname
          : new URL(input.url).pathname;
    calls.push({ input: path, cache: init?.cache, redirect: init?.redirect });
    if (path === '/release.json') {
      return Promise.resolve(
        new Response(JSON.stringify(release), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }
    return Promise.resolve(
      new Response(corpusJson, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  }) as typeof fetch;

  return { fetch: fixtureFetch, calls };
}

describe('browser release runtime', () => {
  it('loads no-store metadata and its verified content-addressed corpus', async () => {
    const fixture = makeReleaseFixture();
    const fixtureFetch = createFixtureFetch(
      fixture.release,
      fixture.corpusJson,
    );

    const verified = await loadVerifiedRelease({
      fetch: fixtureFetch.fetch,
      crypto: globalThis.crypto,
    });

    expect(fixtureFetch.calls).toEqual([
      { input: '/release.json', cache: 'no-store', redirect: 'error' },
      {
        input: fixture.release.contentPath,
        cache: 'no-store',
        redirect: 'error',
      },
    ]);
    expect(verified.descriptor).toEqual(fixture.release);
    expect(verified.corpus.releaseId).toBe(RELEASE_ID);
    expect(verified.itemsById.get('hafez-one')).toEqual(makeItem());
  });

  it.each([
    [
      'strict release shape',
      (release: ReleaseDescriptor) => ({ ...release, privatePath: '/secret' }),
    ],
    [
      'release ID mismatch',
      (release: ReleaseDescriptor) => ({
        ...release,
        releaseId: 'other-release',
      }),
    ],
    [
      'count mismatch',
      (release: ReleaseDescriptor) => ({
        ...release,
        itemCount: 2,
        hafezCount: 2,
      }),
    ],
  ])('fails closed on %s', async (_label, mutateRelease) => {
    const fixture = makeReleaseFixture();
    const fixtureFetch = createFixtureFetch(
      mutateRelease(fixture.release),
      fixture.corpusJson,
    );

    await expect(
      loadVerifiedRelease({
        fetch: fixtureFetch.fetch,
        crypto: globalThis.crypto,
      }),
    ).rejects.toMatchObject({
      name: 'ReleaseLoadError',
      message: RELEASE_ERROR_MESSAGE,
    });
  });

  it('rejects corpus byte tampering before parsing content', async () => {
    const fixture = makeReleaseFixture();
    const fixtureFetch = createFixtureFetch(
      fixture.release,
      `${fixture.corpusJson} `,
    );

    await expect(
      loadVerifiedRelease({
        fetch: fixtureFetch.fetch,
        crypto: globalThis.crypto,
      }),
    ).rejects.toBeInstanceOf(ReleaseLoadError);
  });

  it.each([
    [
      'strict corpus shape',
      (item: PublicContentItem) => ({
        schemaVersion: 2,
        releaseId: RELEASE_ID,
        items: [item],
        visitor: 'must never be accepted',
      }),
    ],
    [
      'duplicate IDs',
      (item: PublicContentItem) => ({
        schemaVersion: 2,
        releaseId: RELEASE_ID,
        items: [item, item],
      }),
    ],
    [
      'item content hash mismatch',
      (item: PublicContentItem) => ({
        schemaVersion: 2,
        releaseId: RELEASE_ID,
        items: [{ ...item, contentHash: 'b'.repeat(64) }],
      }),
    ],
  ])(
    'rejects %s even when the outer digest matches',
    async (_label, makeCorpus) => {
      const corpusJson = JSON.stringify(makeCorpus(makeItem()));
      const release = {
        ...makeReleaseFixture().release,
        contentSha256: sha256(corpusJson),
        contentPath: `/content/${sha256(corpusJson)}.json`,
      };
      const fixtureFetch = createFixtureFetch(release, corpusJson);

      await expect(
        loadVerifiedRelease({
          fetch: fixtureFetch.fetch,
          crypto: globalThis.crypto,
        }),
      ).rejects.toBeInstanceOf(ReleaseLoadError);
    },
  );

  it.each([
    [
      'raw markup',
      rehashItem({
        ...makeItem(),
        text: {
          ...makeItem().text,
          englishLines: ['<script>not allowed</script>', 'Second line'],
        },
      }),
    ],
    [
      'bidi control characters',
      rehashItem({
        ...makeItem(),
        translationCredit: 'TEST ONLY credit\u202E',
      }),
    ],
    [
      'an out-of-contract reflection length',
      rehashItem({ ...makeItem(), reflection: 'Far too short.' }),
    ],
  ])('rejects %s from a digest-valid corpus', async (_label, item) => {
    const fixture = makeReleaseFixture([item]);
    const fixtureFetch = createFixtureFetch(
      fixture.release,
      fixture.corpusJson,
    );

    await expect(
      loadVerifiedRelease({
        fetch: fixtureFetch.fetch,
        crypto: globalThis.crypto,
      }),
    ).rejects.toBeInstanceOf(ReleaseLoadError);
  });

  it.each(BUILD_RUNTIME_PARITY_CASES)(
    'matches the build rejection for %s',
    async (_label, item) => {
      expect(publicContentItemSchema.safeParse(item).success).toBe(false);
      const fixture = makeReleaseFixture([item]);
      const fixtureFetch = createFixtureFetch(
        fixture.release,
        fixture.corpusJson,
      );

      await expect(
        loadVerifiedRelease({
          fetch: fixtureFetch.fetch,
          crypto: globalThis.crypto,
        }),
      ).rejects.toBeInstanceOf(ReleaseLoadError);
    },
  );

  it('uses the privacy-safe blocking error when Web Crypto is unavailable', async () => {
    const fixture = makeReleaseFixture();
    const fixtureFetch = createFixtureFetch(
      fixture.release,
      fixture.corpusJson,
    );

    await expect(
      loadVerifiedRelease({ fetch: fixtureFetch.fetch, crypto: null }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'ReleaseLoadError',
        message: RELEASE_ERROR_MESSAGE,
      }),
    );
  });

  it('fails closed when digest exists but secure random values are unavailable', async () => {
    const fixture = makeReleaseFixture();
    const fixtureFetch = createFixtureFetch(
      fixture.release,
      fixture.corpusJson,
    );

    await expect(
      loadVerifiedRelease({
        fetch: fixtureFetch.fetch,
        crypto: {
          subtle: globalThis.crypto.subtle,
        },
      }),
    ).rejects.toBeInstanceOf(ReleaseLoadError);
  });
});
