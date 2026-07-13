import type { PublicContentItem } from '../../src/contracts/content';
import type { VerifiedRelease } from '../../src/app/runtime';

const CONTENT_HASH = 'a'.repeat(64);

function reflection(poet: string): string {
  return `Pause with this ${poet} passage and notice what asks to be carried forward. The verse does not predict an outcome or decide a path for you. It offers a reviewed literary image that you may hold beside your own question, hope, or uncertainty with patience, care, attention, and room for another interpretation.`;
}

export const HAFEZ_ITEM: PublicContentItem = {
  id: 'hafez-one',
  schemaVersion: 2,
  poet: 'hafez',
  mode: 'open_the_divan',
  display: { visualVariant: 'garden_night', accent: 'pomegranate' },
  source: {
    workEn: 'The Divan of Hafez',
    workFa: 'دیوان حافظ',
    editionPublicCredit: 'TEST ONLY public edition credit',
    reference: 'Ghazal 1 · line 2',
    openingHemistichFa: 'الا یا ایها الساقی',
  },
  text: {
    englishLines: ['Cupbearer, pass the cup', 'And let it travel onward'],
    persianLines: ['الا یا ایها الساقی', 'ادر کاسا و ناولها'],
    alignment: 'line',
  },
  translationClassification: 'society_translation',
  translationCredit: 'TEST ONLY Society translation',
  reflection: reflection('Hafez'),
  audio: {
    assetPath: 'audio/hafez-aaaaaaaa.mp3',
    mimeType: 'audio/mpeg',
    durationSeconds: 24,
    performerCredit: 'TEST ONLY reciter',
  },
  contentHash: CONTENT_HASH,
};

export const RUMI_ITEM: PublicContentItem = {
  id: 'rumi-one',
  schemaVersion: 2,
  poet: 'rumi',
  mode: 'moment_of_reflection',
  display: { visualVariant: 'lamp_constellation', accent: 'lapis' },
  source: {
    workEn: 'The Masnavi',
    workFa: 'مثنوی معنوی',
    editionPublicCredit: 'TEST ONLY public edition credit',
    reference: 'Book 1 · passage 1',
    openingHemistichFa: null,
  },
  text: {
    englishLines: ['Listen to the reed', 'As it tells its story'],
    persianLines: ['بشنو از نی', 'چون حکایت می‌کند'],
    alignment: 'line',
  },
  translationClassification: 'adaptation',
  translationCredit: 'TEST ONLY Society adaptation',
  reflection: reflection('Rumi'),
  audio: null,
  contentHash: CONTENT_HASH,
};

export function makeVerifiedRelease(
  items: readonly PublicContentItem[] = [HAFEZ_ITEM, RUMI_ITEM],
): VerifiedRelease {
  const descriptor = {
    releaseId: 'test-only-release',
    schemaVersion: 2 as const,
    builtAt: '2026-07-13T00:00:00.000Z',
    buildProfile: 'fixture' as const,
    productionEligible: false,
    itemCount: items.length,
    hafezCount: items.filter((item) => item.poet === 'hafez').length,
    rumiCount: items.filter((item) => item.poet === 'rumi').length,
    contentPath: `/content/${CONTENT_HASH}.json`,
    contentSha256: CONTENT_HASH,
    assetManifestPath: `/assets/${CONTENT_HASH}.json`,
    assetManifestSha256: CONTENT_HASH,
  };
  return {
    descriptor,
    corpus: {
      schemaVersion: 2,
      releaseId: descriptor.releaseId,
      items,
    },
    itemsById: new Map(items.map((item) => [item.id, item])),
  };
}
