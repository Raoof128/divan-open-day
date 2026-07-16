# DIVAN content editor workflow

## Current release status

The repository contains a source-bound production corpus of exactly 60 Hafez
and 60 Rumi excerpts. Every item uses machine-alignment authority tied to source,
span, reference, and mapping hashes. No reflection, contributor, reviewer,
teacher, or human approval identity is invented. The local production package
build passes; independent public-launch, governance, legal, deployment, manual
accessibility, and physical-QR gates remain separate and closed until evidenced.

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
  production-selection.yaml
  approvals.yaml
  assets.yaml
```

No other files or directories are accepted. Every YAML filename is lowercase
kebab-case, an item filename exactly matches its `id`, and the item must be in
the directory matching its poet. Symlinks, aliases, anchors, custom tags,
multiple YAML documents, duplicate keys, remote URLs, and unknown fields are
rejected.

## Editor sequence

1. Register the exact English and Persian source snapshots, stable references,
   and lowercase SHA-256 hashes before selecting any span.
2. Register the exact Persian edition and its internal citation plus required
   public credit in `editions.yaml`.
3. Create one authoring YAML item from the strict schema. Preserve the source;
   do not write a fresh translation or interpretation. Any scan-normalised OCR
   must be explicit and disclosed. English precedes Persian publicly.
4. Record the selected spans and explicit English-to-Persian mapping, then issue
   machine authority over both source hashes, both span hashes, the source
   references, and the mapping hash. Any later change invalidates that verdict.
5. Record translation and, where applicable, asset/audio permissions in
   `permissions.yaml`. Evidence locations stay private. Required public uses
   are website display, downloadable share card, event print, and archival
   hosting. Public delivery requires worldwide coverage.
6. Add any local media metadata to `assets.yaml` only after its file digest,
   byte size, rights, performer details, and MIME type have been verified.
   Remote asset URLs are prohibited.
7. Use only `MACHINE_VERIFIED`, `MACHINE_VERIFIED_WITH_DISCLOSURE`, or
   `EXCLUDED`. An excluded record must remain outside both production poet
   directories. A corrected mapping receives a fresh machine verdict; it never
   enters a human-reapproval state.
8. Set the item to `approved` only after the source-bound authority is current.
   Legacy human authority remains supported for historical records, but is not
   required for machine-authority production eligibility.
9. Run the complete content tests and a production build with the explicit
   configuration below. Treat any failure as a release blocker; never weaken a
   count, schema, evidence, or fixture-leak gate to make a build pass.
10. Inspect and archive the verified release descriptor, corpus checksum, asset
    manifest checksum, commit, source hashes, and applicable external approval
    evidence before deployment.

## Production build configuration

Use Node 22.16.0 and pnpm 10.33.0. Production requires:

```text
DIVAN_PUBLIC_ORIGIN=https://approved-origin.example
DIVAN_RELEASE_ID=<lowercase-kebab-case-release-id>
DIVAN_MIN_HAFEZ_COUNT=<integer-at-least-60>
DIVAN_MIN_RUMI_COUNT=<integer-at-least-60>
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

In the present repository, `pnpm build:production` succeeds only when all seven
non-secret production inputs are explicit and the exact 60/60/120 corpus remains
source-bound. Omitting the inputs or changing a source, span, reference, mapping,
verdict, permission, count, or fixture boundary fails closed.

Fixture-only engineering verification uses `pnpm build:fixture`. Its 24 Hafez
and 16 Rumi records are always marked `productionEligible: false`; its sole
audio-shaped asset contains the exact bytes `TEST ONLY - NOT AUDIO` and is not
an audio recording or production asset.
