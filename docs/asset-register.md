# DIVAN public asset register

## Current register

No production asset is approved or registered for public release. The launch
gate remains closed. This document makes no claim about a creator, performer,
rights holder, licence, permission, credit, approval, or production file.

The fixture asset metadata and bytes under `tests/fixtures/content/` are
synthetic test input only and are not a public asset record. The sole fixture
audio-shaped file contains exactly `TEST ONLY - NOT AUDIO`; it exists only to
prove manifest/file completeness and can never pass production MIME checks.

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
   matches its declared MIME signature, bytes, and SHA-256.
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
