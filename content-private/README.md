# Canonical source-bound content

This directory contains the selected excerpts and private provenance needed to
build the public corpus. It does not contain full source books. Raw books,
extractions, OCR pages, machine rationales outside the selected records, and
candidate reports remain excluded from release artefacts.

Every production record uses `review_authority.kind: machine_alignment` and is
bound to both immutable source-book hashes, the selected English and Persian
span hashes, the source references, and the line mapping hash. Changing any of
those values invalidates production eligibility until a fresh machine verdict
is issued. The only active machine states are `MACHINE_VERIFIED`,
`MACHINE_VERIFIED_WITH_DISCLOSURE`, and `EXCLUDED`; excluded records are never
placed in the poet directories.

Human authority remains supported for legacy fixture/history records, but a
teacher, contributor, named reviewer, final approval, or human reapproval state
is not required for a source-bound machine-authority item. Rights permissions
are joined to the local source-lock and rights-evidence records without
fabricating a reviewer identity.

The compiler deliberately allowlists public fields. Public output is English
first, retains the Persian lines for `lang="fa" dir="rtl"` rendering, carries
source and translation attribution, and includes any required alignment
disclosure. Private source hashes, mapping metadata, and rationale must not
appear in `dist` or other release artefacts.

Regenerate these records only from the locally acquired, hash-verified sources:

```sh
pnpm poetry:build-production
```
