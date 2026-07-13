# DIVAN public rights register

## Current register

No production content or asset rights record has been approved for publication.
There are no public contributor, translator, reviewer, performer, rights-holder,
licence, permission, attribution, or approval claims in this register. The
production build and public-launch gates remain closed.

## Private evidence fields

Rights evidence is maintained privately and is never copied into the public
distribution. Each permission record must contain:

- stable record `id` and lifecycle `status`;
- allowlisted evidence `kind` and exact `subject_id`;
- named `rights_owner`;
- private `evidence_reference` to the written source of authority;
- every `permitted_use`, including website display, downloadable share card,
  event print, and archival hosting;
- approved public `attribution`;
- whether modification is permitted;
- applicable territories, with worldwide coverage required for this public
  release;
- a real ISO `effective_on` date; and
- an optional real ISO `expires_on` date no earlier than effectiveness.

Final approval is a separate private record containing its stable ID, current
status, item ID, canonical authoring SHA-256, accountable final approver, and
approval date. Contributor records separately bind active people to reviewed
roles. The compiler requires exact joins between the item, edition,
contributors, permissions, assets, and digest-bound approval.

## Publication rule

Only approved public credits constructed by the reviewed compiler may enter the
public corpus. Reviewer IDs, translator IDs, internal edition citations, rights
owners, permission IDs, approval IDs, evidence references, moral-rights notes,
and private file paths must not appear in `dist`.

This file must be updated only from verified human records. Do not infer or
invent a public-domain status, licence, permission, credit, contributor,
reviewer, rights holder, cultural approval, or University approval.

## Source acquisition evidence (pending, not approved)

Archival source editions considered for the corpus are recorded privately in
`sources-private/poetry/rights-evidence.yaml` (schema:
`src/lib/content/sourceRightsSchema.ts`) with the observed public-domain / CC BY-SA
statements and prospective public credits. Every source record is `pending` with
no reviewer; a record cannot become `approved` without a named human rights
reviewer and an acquired source-lock SHA-256. None of that evidence is a public
credit until it passes the Society's documented rights review, and the two Persian
Wikisource transcriptions carry an outstanding CC BY-SA attribution/share-alike
obligation that the rights reviewer must clear before publication.
