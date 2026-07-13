# DIVAN public asset register

## Current register

No production asset is approved or registered for public release. The launch
gate remains closed. This document makes no claim about a creator, performer,
rights holder, licence, permission, credit, approval, or production file.

The fixture asset metadata and bytes under `tests/fixtures/content/` are
synthetic test input only and are not a public asset record. The sole fixture
audio-shaped file contains exactly `TEST ONLY - NOT AUDIO`; it exists only to
prove manifest/file completeness and can never pass production MIME checks.

## Bundled interface resources

The following B2 resources are repository-controlled interface dependencies,
not candidate poetry, audio, image, calligraphy, performer, or University
assets. Their presence does not open the production-content or public-launch
gate.

- Original inline SVG geometry: `divan-eight-point-field`,
  `divan-manuscript-corners`, `divan-pomegranate-cypress`, and
  `divan-reed-rosette`. These script-free primitives were authored for the
  DIVAN interface in `src/components/DecorativeGeometry.tsx`; they contain no
  remote reference, event handler, copied calligraphy, personal attribution,
  or third-party artwork.
- `@fontsource/cormorant-garamond` 5.2.11, local Latin 500- and 600-normal
  WOFF2, package-declared `OFL-1.1`.
- `@fontsource/inter` 5.2.8, local Latin 400- and 700-normal WOFF2,
  package-declared `OFL-1.1`.
- `@fontsource/vazirmatn` 5.2.8, local Arabic 400-normal WOFF2,
  package-declared `OFL-1.1`.
- `@fontsource/noto-nastaliq-urdu` 5.2.8, local Arabic 400-normal WOFF2,
  package-declared `OFL-1.1`; restricted by the interface to short decorative
  Persian labels.

All four font files are bundled by the pinned build, use `font-display: swap`,
and have local fallbacks. No runtime font request leaves the built origin.

## Required private asset record

Each candidate asset is recorded in private `content-private/assets.yaml` with:

- `id`: stable lowercase kebab-case identifier;
- `status`: reviewed lifecycle status;
- `kind`: allowlisted audio, font, icon, image, or ornament kind;
- `path`: safe local path under the matching allowlisted asset root;
- `mime_type`: allowlisted MIME type matching the extension and kind;
- `sha256`: lowercase SHA-256 of the exact candidate bytes;
- `bytes`: exact non-negative file size;
- `permission_record_id`: matching private permission record;
- `performer_id`: required for audio and null for non-audio assets; and
- `duration_seconds`: required for audio and null for non-audio assets.

The linked permission record must separately identify the subject, rights
owner, evidence reference, uses, attribution, modification permission,
territory, effective date, and expiry. Evidence files and private identifiers
never enter `dist`.

## Release requirements

Before an asset may appear in a release:

1. An authorised human verifies source, creator/performer, rights holder, exact
   evidence, public credit, allowed modifications, territory, expiry, and every
   intended public use.
2. The local file is read only below the canonical, non-symlink
   `public-static/` root, has no embedded secret or private metadata, and
   matches its declared MIME signature, bytes, and SHA-256. Registry and public
   manifest byte counts must be integers from 1 through 100,000,000 inclusive;
   filesystem size is checked before reading, and SHA-256 is computed in
   bounded chunks.
3. The published filename is content-addressed where the release contract
   requires it; remote URLs and path traversal are rejected.
4. The release asset manifest is canonical JSON, sorted by path, hashed, and
   referenced by the matching hash in `release.json`.
5. `verify-dist` confirms every declared file, size, and digest and rejects
   undeclared files, source maps, YAML, permission evidence, remote resources,
   symlinks, and private paths.

At this content-only implementation stage no production asset exists. Fixture
builds emit one conspicuous synthetic audio-shaped file so the canonical,
content-addressed asset manifest and the public corpus-to-manifest join are
exercised end to end.
