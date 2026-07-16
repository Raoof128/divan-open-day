import { describe, expect, it } from 'vitest';

import { FIXED_BROWSER_ASSETS } from '../../src/lib/content/release';
import { FIXED_MIME } from '../../src-sw/schemas';

// The browser app and the service worker validate the release independently and
// must agree on the fixed asset set. CLAUDE.md records the failure mode: a
// mismatch surfaces to visitors only at runtime, as "Offline release staging
// failed".
//
// The gap is one-directional and was proven by experiment. Adding an asset to
// the app-side FIXED_BROWSER_ASSETS alone already fails three existing tests in
// tests/content/release.test.ts. Adding one to the service-worker-side
// FIXED_MIME alone passed the entire suite (62 files / 706 tests) with the two
// validators disagreeing. This test closes that direction.
describe('fixed browser asset contract', () => {
  it('is identical across the app and service-worker validators', () => {
    expect([...FIXED_MIME.keys()].toSorted()).toEqual(
      [...FIXED_BROWSER_ASSETS.keys()].toSorted(),
    );

    for (const [path, mimeType] of FIXED_BROWSER_ASSETS) {
      expect(FIXED_MIME.get(path), `MIME drift for "${path}"`).toBe(mimeType);
    }
  });
});
