import { describe, expect, it } from 'vitest';

import { compileCorpus } from '../../src/lib/content/compileCorpus';
import {
  makeFixtureCorpus,
  refreshFixtureApproval,
} from '../fixtures/content/corpus';

const BUILD_DATE = '2026-07-13';

function compileFixture(corpus = makeFixtureCorpus()) {
  return compileCorpus({
    profile: 'fixture',
    items: corpus.items,
    registries: corpus.registries,
    buildDate: BUILD_DATE,
  });
}

function compileProduction(corpus = makeFixtureCorpus()) {
  return compileCorpus({
    profile: 'production',
    items: corpus.items,
    registries: corpus.registries,
    buildDate: BUILD_DATE,
  });
}

describe('compileCorpus', () => {
  it('compiles the exact 24 Hafez and 16 Rumi synthetic fixture corpus', () => {
    const corpus = makeFixtureCorpus();
    corpus.items.reverse();

    const compiled = compileFixture(corpus);

    expect(compiled).toMatchObject({
      hafezCount: 24,
      rumiCount: 16,
      totalCount: 40,
      productionEligible: false,
    });
    expect(compiled.items.map((item) => item.id)).toEqual(
      compiled.items.map((item) => item.id).toSorted(),
    );
    expect(compiled.items[0]?.audio).toMatchObject({
      assetPath: 'audio/test-only-hafez-01.mp3',
      performerCredit: 'TEST ONLY / SYNTHETIC PERFORMER CREDIT',
    });
  });

  it('rejects duplicate authoring item IDs before compilation', () => {
    const corpus = makeFixtureCorpus();
    corpus.items.push(structuredClone(corpus.items[0]!));

    expect(() => compileFixture(corpus)).toThrow(/duplicate item id/iu);
  });

  it('rejects unknown or invalid registry data before compilation', () => {
    const corpus = makeFixtureCorpus();
    Object.assign(corpus.registries, { private_notes: 'TEST ONLY' });

    expect(() => compileFixture(corpus)).toThrow(/unrecognized|registry/u);
  });

  it('rejects drafts in production', () => {
    const corpus = makeFixtureCorpus();
    corpus.items[0]!.status = 'draft';

    expect(() => compileProduction(corpus)).toThrow(/draft/u);
  });

  it('excludes disabled items before enforcing production minimums', () => {
    const corpus = makeFixtureCorpus();
    corpus.items[0]!.status = 'disabled';

    expect(() => compileProduction(corpus)).toThrow(/24 Hafez/u);
  });

  it('rejects fixture sentinels and fixture IDs in production', () => {
    expect(() => compileProduction()).toThrow(/fixture|TEST ONLY/u);
  });

  it('rejects a missing edition join', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.editions.editions.shift();

    expect(() => compileFixture(corpus)).toThrow(/edition/u);
  });

  it('rejects a missing translation permission join', () => {
    const corpus = makeFixtureCorpus();
    const permissionId = corpus.items[0]!.translation.permission_record_id;
    corpus.registries.permissions.permissions =
      corpus.registries.permissions.permissions.filter(
        (permission) => permission.id !== permissionId,
      );

    expect(() => compileFixture(corpus)).toThrow(/permission/u);
  });

  it('rejects a missing required reviewer join', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.contributors.contributors =
      corpus.registries.contributors.contributors.filter(
        (contributor) => contributor.id !== 'test-only-source-editor',
      );

    expect(() => compileFixture(corpus)).toThrow(/source_editor|reviewer/u);
  });

  it('rejects a missing final approval join', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.approvals.approvals.shift();

    expect(() => compileFixture(corpus)).toThrow(/approval/u);
  });

  it('rejects a missing enabled-audio asset join', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.assets.assets = [];

    expect(() => compileFixture(corpus)).toThrow(/audio asset/u);
  });

  it('rejects an expired permission at the injected build date', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.permissions.permissions[0]!.expires_on = '2026-07-12';

    expect(() => compileFixture(corpus)).toThrow(/expired/u);
  });

  it('rejects future-effective approval evidence', () => {
    const corpus = makeFixtureCorpus();
    const item = corpus.items[0]!;
    const approval = corpus.registries.approvals.approvals[0]!;
    item.review.approved_at = '2026-07-14';
    approval.approved_at = '2026-07-14';
    refreshFixtureApproval(corpus, item.id);

    expect(() => compileFixture(corpus)).toThrow(/future/u);
  });

  it('rejects a permission for the wrong evidence use', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.permissions.permissions[0]!.kind = 'audio';

    expect(() => compileFixture(corpus)).toThrow(/translation|wrong.*use/u);
  });

  it('rejects territorially insufficient permission evidence', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.permissions.permissions[0]!.territories = ['AU'];

    expect(() => compileFixture(corpus)).toThrow(/territor/u);
  });

  it('rejects non-current final approval evidence', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.approvals.approvals[0]!.status = 'superseded';

    expect(() => compileFixture(corpus)).toThrow(/current|approved/u);
  });

  it('rejects stale approval metadata', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.approvals.approvals[0]!.approved_at = '2026-07-11';

    expect(() => compileFixture(corpus)).toThrow(/stale|approval date/u);
  });

  it('rejects approval digest mismatch against the canonical authoring item', () => {
    const corpus = makeFixtureCorpus();
    corpus.registries.approvals.approvals[0]!.authoring_sha256 = '0'.repeat(64);

    expect(() => compileFixture(corpus)).toThrow(/digest|SHA-256/u);
  });

  it('rejects a translator as the sole accountable reviewer', () => {
    const corpus = makeFixtureCorpus();
    const item = corpus.items[0]!;
    item.reflection.reviewer_ids = ['test-only-translator'];
    item.review.source_editor_ids = ['test-only-translator'];
    item.review.persian_literary_reviewer_ids = ['test-only-translator'];
    item.review.english_editor_ids = ['test-only-translator'];
    item.review.cultural_reviewer_ids = ['test-only-translator'];
    item.review.rights_reviewer_ids = ['test-only-translator'];
    refreshFixtureApproval(corpus, item.id);

    expect(() => compileFixture(corpus)).toThrow(/translator/u);
  });

  it('rejects a production corpus with only 23 Hafez and 16 Rumi records', () => {
    const corpus = makeFixtureCorpus();
    corpus.items = corpus.items.filter((item) => item.id !== 'test-only-hafez-24');

    expect(() => compileProduction(corpus)).toThrow(/24 Hafez/u);
  });

  it('rejects a production corpus with 24 Hafez and only 15 Rumi records', () => {
    const corpus = makeFixtureCorpus();
    corpus.items = corpus.items.filter((item) => item.id !== 'test-only-rumi-16');

    expect(() => compileProduction(corpus)).toThrow(/16 Rumi/u);
  });

  it('rejects invalid injected build dates', () => {
    const corpus = makeFixtureCorpus();

    expect(() =>
      compileCorpus({
        profile: 'fixture',
        items: corpus.items,
        registries: corpus.registries,
        buildDate: '2026-99-99',
      }),
    ).toThrow(/build date/iu);
  });
});
