# Private content boundary

This directory is reserved for private authoring inputs and their reviewed human evidence. It intentionally contains no production poetry, translation, reflection, provenance, permission, approval, contributor, or media records.

Private authoring inputs and evidence must never be copied into `dist`, a release archive, a container image, a service-worker cache, or any other public artefact. The public corpus may contain only the allowlisted fields produced by the reviewed compiler.

Before any production item can compile, authorised humans must provide and verify:

- an approved source edition and stable edition-specific reference;
- reviewer-accepted Persian source text, English translation, and reflection;
- active contributor records for the translator, source editor, Persian literary reviewer, English editor, cultural reviewer, rights reviewer, and final approver;
- written permission evidence covering every public use and worldwide public delivery, with approved attribution and any expiry recorded;
- a current final approval bound to the exact canonical SHA-256 digest of the authoring item; and
- for enabled audio, an approved local asset, performer record, and matching written permission evidence.

Synthetic fixtures live only under `tests/fixtures/content/`. They use conspicuous `TEST ONLY`, `NOT POETRY`, `NOT TRANSLATION`, and `NOT INTERPRETATION` sentinels, are never production-eligible, and must be rejected by production compilation.

The public-launch gate remains closed. It can be reconsidered only after genuine content and evidence are supplied, every production compiler gate passes, and the separate governance, cultural, rights, accessibility, security, deployment, rollback, and physical-QR approvals are complete.
