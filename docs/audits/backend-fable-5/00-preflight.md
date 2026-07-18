# Backend audit — Phase 0 preflight

Date: 2026-07-17 (Australia/Sydney).
Status: **agent-executed audit record**. Nothing here asserts an operator gate that did not occur.

## Provenance

|                  |                                                                  |
| ---------------- | ---------------------------------------------------------------- |
| Repository       | `Raoof128/divan-open-day` (`https://github.com/Raoof128/divan-open-day.git`) |
| Source SHA       | `adde8b4ce2adb5a8c612561601e586fc9232877f`                        |
| `origin/main`    | `adde8b4ce2adb5a8c612561601e586fc9232877f` (identical — not a stale branch) |
| Audit branch     | `audit/fable-5-exhaustive-backend`, created from `origin/main`    |
| Worktree state   | clean for tracked files; 6 pre-existing untracked items preserved |
| Toolchain        | Node 22.16.0, pnpm 10.33.0 (both pinned and matched)              |
| Last release     | `v1.0.6` — live at `https://divan.raoufabedini.dev`               |

`git fetch --all --prune` pruned three merged remote branches (`docs/release-v1-0-6-evidence`,
`fix/edge-html-injection-navigation-outage`, `fix/verify-header-contract-no-transform`). No local
branch was deleted, reset, or rewritten.

### Untracked items preserved (not mine, not touched)

```
New_Frontend/
docs/audits/frontend-opus-4-8/
scripts/poetry/build-hafez-align-tasks.ts
sources-private/poetry/reports/hafez-align-tasks.json
sources-private/poetry/reports/hafez-clarke-align-proposals-UNVERIFIED.json
sources-private/poetry/reports/hafez-ghazal-matlas.json
```

## Instruction files read completely

| File | Lines | Role |
| ---- | ----- | ---- |
| `AGENT.md` | 833 | **Binding engineering contract** (lines 1–28) + full `Raouf:` change log |
| `/Users/raoof.r12/.claude/CLAUDE.md` | — | Global Zurvan recall instructions |
| `CLAUDE.md` (project, git-ignored) | — | Operational detail; explicitly subordinate to `AGENT.md` + design authority |
| `package.json` | 99 | Scripts, engines, pinned dependency set |

Instruction-file discovery (`find .. -name 'AGENT*.md' -o -name 'AGENTS*.md'`) found 18 files
across sibling repositories. Only `../OpemDay/AGENT.md` applies to this working tree; the rest
belong to unrelated projects (`MQ_Journey`, `nexus-os`, `Zurvan`, `Project-Simurgh`, …) and were
correctly not applied. `../OpemDay-audit-opus48/AGENT.md` is a separate checkout, not this tree.

### Binding constraints extracted from `AGENT.md` §Engineering contract

1. Vite + React + strict TypeScript + hand-controlled service worker + unprivileged static image.
2. **No** database, public write endpoint, analytics, cookies, identifiers, remote fonts, runtime
   poetry APIs, autoplay, or raw HTML rendering.
3. Never fabricate poetry, translation, provenance, licences, approvals, reviews, credits, or
   production configuration. Production compilation must reject fixtures.
4. English before Persian; Persian stays live text with `lang="fa" dir="rtl"` and bidi isolation.
5. **TDD is mandatory** for behaviour: observe a meaningful failing test, implement the minimum,
   refactor while green.
6. Accessibility, reduced motion, offline release coherence, privacy, security headers, container
   isolation and rollback are **release behaviour**, not documentation claims.
7. Keep `.env`, permission evidence, tunnel credentials, private authoring records, source maps and
   EOI/ballot data out of public output and logs.
8. **Never** change, connect to, or share the EOI/ballot code, database, volume, network, route,
   environment, or credential.
9. Focused commits; fresh verification before recording completion.

Precedence applied throughout this audit: **this goal → repository instruction files → Release 1
design authority → nearest applicable skill contract → general guidance.**

## Architecture summary (what "backend" means here)

DIVAN Release 1 is a **static, offline-first, privacy-preserving SPA**. There is deliberately no
visitor database, no runtime application API, no public write endpoint, no account system, and no
dynamic application server. This is an intentional architectural property, not a gap, and this audit
does not "fix" it by adding one.

The backend-equivalent trust surface is the non-visual system that makes the static artefact
trustworthy and deployable:

```
sources-private/registry.yaml
  → fetch-sources.ts (HTTPS + host allowlist + size cap + SHA-256 source-lock)
  → extract-* (EPUB/OCR/hOCR, deterministic, raw vs normalised separated)
  → candidate index (publishable:false — the compiler refuses it)
  → alignment / reviewAuthority (machine or human; binds source+span+mapping hashes)
  → content-private/{hafez,rumi}/*.yaml   (120 reviewed authoring records, TRACKED)
  → production-selection.yaml             (explicit; no directory-order selection)
  → compileCorpus / canonical / release.ts
  → dist/release.json + dist/content/<sha256>.json + hashed assets + service-worker.js
  → verify-dist.ts (exact file set, leak scan, no remote resources, no source maps)
  → ops/Dockerfile → scratch image (Caddy 2.11.4, UID 10001, read-only, cap_drop ALL)
  → ops/scripts/{preflight,deploy,verify,rollback}.sh (immutable digest, fail-closed)
  → cloudflared tunnel → https://divan.raoufabedini.dev
```

Release coherence is enforced **twice, independently**: `src/lib/content/release.ts` at build time
and `src-sw/schemas.ts` at runtime in the browser. A drift between those two mirrored schemas is a
release-integrity defect class, and the change log records that it has bitten before.

`content-private/` is **only partly git-ignored**: `.gitignore` excludes `content-private/*` then
re-includes the approved corpus by negation, so **127 files are tracked** and `git archive <tag>`
reproduces a full production build. Raw/unreviewed source material under `sources-private/raw` and
`extracted/` stays ignored — only the registry, rights evidence, source-lock, and text-free reports
are committed.

## Live boundaries that will NOT be touched

Per the goal's non-negotiable boundaries, and independently required by `AGENT.md`:

- **No** deploy, merge, tag, publish, or push of a release.
- **No** mutation of DigitalOcean, Cloudflare, DNS, the tunnel, the registry, firewall rules, live
  containers, production access policy, or `https://divan.raoufabedini.dev`.
- **No** read of `.env` or any live credential. `Read(./.env)` remains deny-listed in
  `.claude/settings.json` and **was not lifted for this audit**. All build inputs used here are
  explicit, non-secret, and audit-only.
- **No** contact with the neighbouring services on the same droplet (`persian-society-eoi-*`,
  `reasoning-engine-mcp`, `nexus-api`).
- **No** destructive git (`git add -A`, force-push, reset, clean, history rewrite).

Container work, where Docker is available, is confined to **disposable local images that are never
pushed** and never joined to the live Compose project or its named networks.

## Initial blockers and limitations (declared up front)

1. **`verify:qr` is fail-closed by design** and will remain so. The physical QR deliverable is an
   external gate; a failure here is the contract working, not a defect to repair.
2. **`build:production` requires explicit env inputs** and exits 1 without them. That is also the
   contract working. This audit supplies audit-only, non-secret values and never deploys the result.
3. **`pnpm audit` is externally blocked** — npm retired both configured endpoints (HTTP 410). The
   repository already compensates with a commit-pinned OSV scan in CI. This is a pre-existing,
   environmental condition, not a finding introduced here.
4. **Docker availability is not yet confirmed** for this session. If the daemon is absent, container
   evidence will be recorded as unavailable rather than skipped silently or inferred.
5. **`shellcheck` availability is not yet confirmed.** If absent it will be recorded as unavailable;
   `bash -n` syntax checking is available regardless.
6. **Live infrastructure evidence is out of scope by instruction.** Nothing in this audit may claim
   that the Droplet, provider logs, backups, firewall, or rollback were exercised. Prior evidence
   for those lives in `docs/verification/` and is not re-asserted here.
7. **Outstanding from the v1.0.6 session, carried forward, not addressed by this audit:** Cloudflare
   Web Analytics remains enabled on the zone (`no-transform` blocks injection but the product is
   still configured), and four credentials exposed in an earlier transcript still require rotation.

## Phase 0 verdict

Preflight **PASS**. The tree is clean, the branch is isolated from current `origin/main`, the
binding authority has been read in full, and the live boundaries are declared. Proceeding to the
skill inventory and the frozen file inventory.
