# DIVAN content editor workflow

## Current release status

There is no approved production poetry corpus in this repository. There are no
approved production translations, reflections, contributors, permissions,
reviews, approvals, audio files, or other public assets. The production build
and public-launch gates are closed.

The files under `tests/fixtures/content/` are conspicuous synthetic test data.
They are not poetry, translation, interpretation, evidence, or publication
content and must never be copied into `content-private/`.

## Required private layout

Authorised editors work only in the private source tree:

```text
content-private/
  README.md
  hafez/<item-id>.yaml
  rumi/<item-id>.yaml
  editions.yaml
  contributors.yaml
  permissions.yaml
  approvals.yaml
  assets.yaml
```

No other files or directories are accepted. Every YAML filename is lowercase
kebab-case, an item filename exactly matches its `id`, and the item must be in
the directory matching its poet. Symlinks, aliases, anchors, custom tags,
multiple YAML documents, duplicate keys, remote URLs, and unknown fields are
rejected.

## Editor sequence

1. Confirm the accountable human roles before drafting: source editor, Persian
   literary reviewer, English editor, cultural reviewer, rights reviewer, and
   final approver. An item cannot be approved only by its translator.
2. Register the exact Persian edition and its internal citation plus approved
   public credit in `editions.yaml`.
3. Add active contributor records with only the roles those people are
   authorised to perform.
4. Create one authoring YAML item from the reviewed schema. Preserve the source
   exactly; do not modernise, paraphrase, translate, attribute, or interpret by
   inference. English text precedes Persian in the eventual public experience.
5. Record translation and, where applicable, asset/audio permissions in
   `permissions.yaml`. Evidence locations stay private. Required public uses
   are website display, downloadable share card, event print, and archival
   hosting. Public delivery requires worldwide coverage.
6. Add any local media metadata to `assets.yaml` only after its file digest,
   byte size, rights, performer details, and MIME type have been verified.
   Remote asset URLs are prohibited.
7. Complete Persian literary, English, cultural, rights, and source review.
   Reflections must remain 45–90 words, be human reviewed, and use the
   `reflection_not_prediction` disclaimer profile.
8. Set the item to `approved`, calculate the canonical authoring SHA-256, and
   bind that exact digest to a current record in `approvals.yaml`. Any later
   authoring change invalidates the approval digest and requires review again.
9. Run the complete content tests and a production build with the explicit
   configuration below. Treat any failure as a release blocker; never weaken a
   count, schema, evidence, or fixture-leak gate to make a build pass.
10. Inspect and archive the verified release descriptor, corpus checksum, asset
    manifest checksum, commit, and human approval evidence before deployment.

## Production build configuration

Use Node 22.16.0 and pnpm 10.33.0. Production requires:

```text
DIVAN_PUBLIC_ORIGIN=https://approved-origin.example
DIVAN_RELEASE_ID=<lowercase-kebab-case-release-id>
DIVAN_MIN_HAFEZ_COUNT=<integer-at-least-24>
DIVAN_MIN_RUMI_COUNT=<integer-at-least-16>
DIVAN_BRANDING_MODE=society_only
SOURCE_DATE_EPOCH=<non-negative-integer-UTC-seconds>
```

`society_only` is the default production branding decision. It must still be
set explicitly. `university_approved` is permitted only when
`DIVAN_UNIVERSITY_APPROVAL_ID` contains the recorded approval identifier.

Run:

```text
pnpm test:content
pnpm build:production
pnpm verify:dist
pnpm typecheck
pnpm lint
```

In the present repository, `pnpm build:production` must fail with:

```text
Production build blocked: no approved production corpus exists in content-private.
```

Fixture-only engineering verification uses `pnpm build:fixture`. Its 24 Hafez
and 16 Rumi records are always marked `productionEligible: false`; its sole
audio-shaped asset contains the exact bytes `TEST ONLY - NOT AUDIO` and is not
an audio recording or production asset.
