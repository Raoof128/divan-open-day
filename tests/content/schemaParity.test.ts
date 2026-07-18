import { describe, expect, test } from 'vitest';

import { FIXED_MIME, offlineContentItemSchema } from '../../src-sw/schemas';
import { compileItem } from '../../src/lib/content/compileItem';
import { publicContentItemSchema } from '../../src/lib/content/publicSchema';
import { FIXED_BROWSER_ASSETS } from '../../src/lib/content/release';
import { makeFixtureCorpus } from '../fixtures/content/corpus';

/**
 * The build compiles the corpus with `src/lib/content/*`; the browser
 * independently re-validates the very same bytes with `src-sw/schemas.ts`.
 * Nothing imports across that boundary — the worker cannot pull in
 * `node:crypto` — so the two sides are hand-mirrored, and CLAUDE.md names their
 * drift as a known hazard whose symptom is "Offline release staging failed" for
 * every controlled client.
 *
 * Before this file, four hand-maintained copies of the fixed-asset table
 * existed and no test imported either authority. These tests compare the real
 * exported contracts rather than a transcription of them, so a change made to
 * one side and not the other fails here instead of in the field.
 */
describe('build and service-worker schema parity', () => {
  const sortedEntries = (
    map: ReadonlyMap<string, string>,
  ): [string, string][] =>
    [...map.entries()].toSorted((left, right) =>
      left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0,
    );

  test('both authorities declare the identical fixed browser asset table', () => {
    // A fixed asset added to the build side and forgotten in the worker stages
    // happily and then fails `validMimePath` at runtime. Compare the real maps.
    const build = sortedEntries(FIXED_BROWSER_ASSETS);
    const worker = sortedEntries(FIXED_MIME);

    expect(worker).toStrictEqual(build);
    // Guard the guard: two empty maps would satisfy equality vacuously.
    expect(build.length).toBeGreaterThanOrEqual(11);
    expect(build.map(([path]) => path)).toContain('index.html');
    expect(build.map(([path]) => path)).toContain('service-worker.js');
  });

  test('both sides accept every real compiled fixture item', () => {
    const fixture = makeFixtureCorpus();
    expect(fixture.items.length).toBeGreaterThan(0);

    for (const item of fixture.items) {
      const compiled = compileItem(item);
      expect(publicContentItemSchema.safeParse(compiled).success).toBe(true);
      expect(offlineContentItemSchema.safeParse(compiled).success).toBe(true);
    }
  });

  // Audio paths are the one place the two sides implement the safety rule with
  // different code: the worker rejects dot-prefixed segments explicitly, the
  // compiler relies on its digest-bearing filename pattern to do it. They agree
  // today. These cases assert the AGREEMENT rather than either verdict, so the
  // parity is pinned regardless of which rule does the rejecting.
  test.each([
    ['audio/.hidden-ea5a2658.mp3', 'dot-prefixed filename'],
    ['audio/.sub/clip-ea5a2658.mp3', 'dot-prefixed directory segment'],
    ['audio/../escape-ea5a2658.mp3', 'parent traversal'],
    ['audio/./same-ea5a2658.mp3', 'current-directory segment'],
    ['audio//double-ea5a2658.mp3', 'empty segment'],
    ['audio/back\\slash-ea5a2658.mp3', 'backslash'],
    ['audio/query-ea5a2658.mp3?x=1', 'query string'],
    ['audio/frag-ea5a2658.mp3#a', 'fragment'],
    ['/audio/absolute-ea5a2658.mp3', 'absolute path'],
    ['//host/net-ea5a2658.mp3', 'scheme-relative path'],
    ['audio/wrong-ea5a2658.wav', 'unsupported extension'],
    ['audio/no-extension-ea5a2658', 'missing extension'],
    ['notaudio/elsewhere-ea5a2658.mp3', 'outside the audio root'],
  ])('build and worker agree on %s (%s)', (assetPath) => {
    const fixture = makeFixtureCorpus();
    const withAudio = fixture.items.find((item) => item.audio.enabled);
    expect(withAudio).toBeDefined();
    const compiled = compileItem(withAudio!);
    expect(compiled.audio).not.toBeNull();

    // Control: the unmodified path must be accepted by both, otherwise every
    // rejection below would be indistinguishable from a broken fixture.
    expect(publicContentItemSchema.safeParse(compiled).success).toBe(true);
    expect(offlineContentItemSchema.safeParse(compiled).success).toBe(true);

    const candidate = {
      ...compiled,
      audio: { ...compiled.audio!, assetPath },
    };
    const buildAccepted = publicContentItemSchema.safeParse(candidate).success;
    const workerAccepted =
      offlineContentItemSchema.safeParse(candidate).success;

    expect(buildAccepted).toBe(false);
    expect(workerAccepted).toBe(buildAccepted);
  });
});
