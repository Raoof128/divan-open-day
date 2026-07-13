# DIVAN Release 1 — Verification Report

- **Date:** 2026-07-13 (Australia/Sydney)
- **Commit:** `c552189` on `feat/divan-open-day-r1`
- **Runtime:** Node 22.16.0, pnpm 10.33.0, Playwright 1.57 (Chromium)
- **Scope:** Local implementation-complete verification (design §30/§31.1). Public
  launch (§31.2) and Docker-host evidence remain out of scope for this session.

This report is produced from a real fixture build. Production content is
deliberately absent, so `build:production` is expected to fail closed; that is a
recorded gate, not a defect.

## 1. Gauntlet results (runnable subset)

| Command | Exit | Evidence |
|---------|------|----------|
| `pnpm typecheck` | 0 | strict TypeScript, no errors |
| `pnpm lint` | 0 | ESLint, zero warnings |
| `pnpm test` | 0 | vitest **472 passed / 34 files** |
| `pnpm test:content` | 0 | 236 passed |
| `pnpm test:a11y` | 0 | 18 passed |
| `pnpm test:offline` | 0 | 53 passed |
| `pnpm test:share` | 0 | 13 passed |
| `pnpm test:performance` | 0 | 5 passed (asserts §21.3 budgets) |
| `pnpm test:security` | 0 | 52 passed (ops config, hardening, isolation) |
| `pnpm test:e2e` | 0 | Playwright **5 passed** (a11y ×2, offline, visual ×2) |
| `pnpm build:fixture` | 0 | 40-item fixture release built |
| `pnpm verify:dist` | 0 | dist integrity/leak/remote/source-map checks pass |
| `pnpm verify:privacy` | 0 | no cookies/analytics/trackers/fingerprint/geolocation |
| `pnpm verify:container` | 0 | image contract group (docker-free static) |
| `pnpm verify:headers` | 0 | CSP/header/cache group (docker-free static) |
| `pnpm verify:origin-isolation` | 0 | compose/tunnel isolation group (docker-free static) |
| `pnpm verify:rollback` | 0 | safe deployment controls group (docker-free static) |
| `pnpm audit --prod` | 0 | no known vulnerabilities |
| `pnpm build:production` | **1** | **fail-closed**: "no approved production corpus" (intended) |
| `pnpm verify:qr` | **1** | **fail-closed**: Phase-7 QR gate not satisfied (intended) |

### Compressed budget evidence (§21.3), fixture build

| Asset | Measured | Budget | Status |
|-------|----------|--------|--------|
| Initial JS (gz) | 118 KB | 200 KB | ✅ |
| Critical CSS (gz) | 4.8 KB | 45 KB | ✅ |
| HTML (gz) | 657 B | 40 KB | ✅ |
| Offline total (raw) | 752 KB | 8 MB ceiling | ✅ |

## 2. Environment-blocked (Docker daemon unavailable this session)

These require a host with a running Docker daemon and are **not** claimed as passed:

- `docker buildx build ... -f ops/Dockerfile` (production image build)
- `syft <image>` (SBOM/scan)
- `docker compose -f ops/compose.yml config` against a live daemon
- `ops/scripts/verify.sh` runtime evidence (container hardening, live headers,
  origin isolation, no host-published ports)

The corresponding **configuration** is statically verified by `tests/security`
(52 tests) and the `verify:*` static groups above.

## 3. §31.1 implementation-complete criteria matrix

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Approved URL opens DIVAN | met (code) | `index.html`+`src/main.tsx` boot; final hostname is §31.2 |
| 2 | Mobile & desktop visual systems complete | met | `src/styles/*` tokens/fonts/geometry; `visual.spec.ts` captures 5 baselines |
| 3 | Hafez & Rumi culturally distinct | met | distinct portals/accents; `visual.spec.ts` asserts different portal backgrounds |
| 4 | English precedes Persian | met | `PoemResult.tsx`; e2e/component tests |
| 5 | Persian live RTL with lang markup | met | `lang="fa" dir="rtl"` + `<bdi>`; `SourceCredit.tsx` |
| 6 | Edition provenance/rights/reviews per item | met (fixture) | `SourceCredit.tsx`, `registrySchemas.ts`; production evidence is a gate |
| 7 | Reflection labelled non-predictive | met | "A reflection, not a prediction"; `IntentionScene.tsx` disclaimer |
| 8 | Keyboard & screen readers complete flow | met (code) | `tests/accessibility` 18, e2e keyboard/axe; manual AT is §31.2 |
| 9 | Reduced motion preserves experience | met | `motion.ts`, `RevealScene`; a11y + e2e motion-precedence tests |
| 10 | No PII requested/stored | met | `verify:privacy`; storage session/local-preference only |
| 11 | No analytics/tracking cookie/social SDK | met | `verify:privacy`; CSP `default-src 'none'` |
| 12 | Secure shuffle bag avoids session repeats | met | `shuffleBag.ts`, `secureRandom.ts`; `tests/unit` |
| 13 | Works offline after first load | met (code) | `src-sw/service-worker.ts`; `offline.spec.ts` + `tests/offline` (53) |
| 14 | Failed update retains previous release | met (code) | atomic `releaseManager.ts`; `offline.spec.ts` outage/failure/rollback |
| 15 | Audio optional & rights-cleared | met | `PoemResult` optional `<audio>`, graceful failure; rights are a gate |
| 16 | Share content generated locally | met | `src/lib/share/*`; `tests/share` (13) + `shareAction` component test |
| 17 | Performance budgets pass controlled tests | met | `tests/performance/visualBudgets.test.ts` asserts §21.3 |
| 18 | Cloudflare Tunnel only public path | met (config) | `ops/compose.yml`, `cloudflared`; live evidence env-blocked |
| 19 | Droplet application ports not public | met (config) | no host ports in compose; `tests/security` |
| 20 | Static web container no egress | met (config) | internal network only; `tests/security` |
| 21 | Rollback tested | met (config) | `rollback.sh` + `tests/security` mocked; live rehearsal is a gate |
| 22 | EOI & ballot unchanged | met | no EOI/ballot code touched; isolation asserted in `tests/security` |
| 23 | QR physical matrix passes | **not met (gate)** | Phase-7 physical deliverable; `verify:qr` fail-closed |
| 24 | Verification evidence complete | partial | this report; Docker-host + manual evidence pending |

## 4. §31.2 public-launch gates (all OPEN — not agent-closable)

Official event approval; Society wording approval; University name/logo approval;
final source/translation/cultural/rights approval; named content-incident owner;
manual accessibility review; provider-logging review; final production hostname &
short URL; launch-day fallback pack; approved production corpus; physical QR/print
scan matrix; live deployment + rollback rehearsal.

## 5. Conclusion

Implementation is **complete and locally verified** for every §31.1 criterion that
code can satisfy (1–22 met; 17 and 13/14 now covered by integrated offline and
performance suites; 16 by the new share card). Criterion 23 (QR) and criterion 24
(full evidence) remain open pending Phase-7 physical work and Docker-host/manual
evidence. **The build is not public-launch-ready**; every §31.2 gate stays closed.
