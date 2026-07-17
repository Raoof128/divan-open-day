# Backend audit — Phase 2 primary-source research

Fresh research pass, executed **before** any implementation edit, against the exact versions in the
repository. No upgrade is recommended anywhere in this document; where a pin is behind, the evidence
for keeping it is recorded instead.

Access date for every source: **2026-07-17**. Five parallel read-only researchers covered:
Node/TS/runtime · Zod/YAML/canonicalisation · Vite/reproducibility/service-worker · container/origin/tunnel ·
CI/supply-chain/shell. Each finding below was **re-verified by the lead against real repository code**
before being accepted; two were downgraded on verification and are recorded as such.

Classification vocabulary: `REQUIRED` · `RECOMMENDED` · `NOT_APPLICABLE` · `ALREADY_SATISFIED` ·
`POSSIBLE_DEFECT_TO_VERIFY`.

---

## The framing finding — read first

**Node.js Security Policy — threat model.** Node.js/OpenJS, living document.
<https://github.com/nodejs/node/security/policy> — `REQUIRED (framing)`

> Node trusts "the file system in the environment accessible to it" and "inputs provided to it by the
> code it is asked to run, as it is the responsibility of the application to perform the required
> input validations."

Path traversal and command injection are named **application-level** issues, not Node vulnerabilities.

**Consequence:** there is no upstream backstop. Every containment property in this repo — `dist/`
confinement, source-path confinement, subprocess argument safety, byte ceilings — is the repo's own
obligation. It also means a finding is only a *defect* if this repo's threat model treats its inputs
as untrusted. `content-private/` is a tracked, reviewed 120-record corpus authored by the operator;
`sources-private/raw` holds fetched public-domain books. Neither is attacker-controlled in the
deployed product. **This audit therefore classifies input-hardening items as RECOMMENDED, not
REQUIRED, unless a concrete untrusted path exists** — and says so rather than inflating severity.

---

## Findings that became defects (carried to the ledger)

### R-1 → **B-D-02** · `no-transform` absent on the content-addressed asset class · `POSSIBLE_DEFECT_TO_VERIFY` → **CONFIRMED**

**RFC 9111 §5.2.2.6**, IETF HTTP WG. <https://httpwg.org/specs/rfc9111.html>

> "The no-transform response directive indicates that an intermediary (regardless of whether it
> implements a cache) **MUST NOT** transform the content."

**RFC 8246** (immutable), <https://www.rfc-editor.org/rfc/rfc8246.html> — `immutable` constrains
*client revalidation*; it says **nothing** to an intermediary about rewriting bytes. Only
`no-transform` does. These are independent directives.

**Lead verification** (`ops/Caddyfile`, read in full):

| Matcher | Line | `Cache-Control` | `no-transform`? | SW-verified? |
| ------- | ---- | --------------- | --------------- | ------------ |
| `@immutable` | 41 | `public, max-age=31536000, immutable` | **NO** | **yes — SHA-256** |
| `@noCacheFiles` | 53 | `no-cache, must-revalidate, no-transform` | yes | yes |
| `@documents` | 77 | `no-cache, must-revalidate, no-transform` | yes | byte ceiling |

`@immutable` matches `^/content/[a-f0-9]{64}\.json` — the corpus **named by its own digest** — plus
`/assets/*`, `/images/*`, `/audio/*`, `/fonts/*`. The Caddyfile's own comment (lines 70–75) makes the
argument that convicts the gap: *"The release is content-addressed: proxy-injected bytes are never
correct."* That applies with more force to the class that **is** content-addressed.

Not hypothetical: `docs/verification/2026-07-17-release-v1-0-6-outage-fix.md` records this exact
failure mode already occurring once on HTML — an intermediary rewrote bytes, the SW's verification
rejected them, and every controlled client went offline.

**Untested:** `tests/security/opsConfig.test.ts:247,250` assert `no-transform` for `@documents` and
`@noCacheFiles` only. `ops/scripts/verify.sh:236,240,295` pin it for document/release/worker only.
Nothing covers `@immutable`, so a regression here is invisible to `pnpm check`.

**Live exposure, calibrated honestly:** Cloudflare retired JS/CSS auto-minify in 2024, so `/assets/*.js|css`
exposure is low. The live risk is **image transformation** (Polish/Mirage rewrite avif/webp/png), a
zone dashboard toggle with no repo change and no CI signal — and the same evidence doc records that
Web Analytics **is still enabled on the zone**, so zone-level transformation features are demonstrably in play.

Header-only change: no corpus, rights, provenance, or asset bytes change; no release-hash consequence.

### R-2 → **B-D-03** · `/healthz` public denial defeated by case variation · `POSSIBLE_DEFECT_TO_VERIFY` → **CONFIRMED BY EXECUTION**

**Caddy request matchers**, <https://caddyserver.com/docs/caddyfile/matchers> — *"Path matches are
exact but **case-insensitive**."*
**Cloudflare Tunnel configuration file**, <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/>
— *"it evaluates each ingress rule from top to bottom"*; path regex uses *"the **Go syntax package**"* (case-sensitive absent `(?i)`).

**Design authority requirement** (`2026-07-12-…-audited.md:1506`):
> "Cloudflare Tunnel ingress or an edge rule **must return 404** for public requests to `/healthz`."
and line 2156: *"block public `/healthz` at Tunnel ingress or edge."*

**Both halves proven locally by the lead — not inferred:**

```
# disposable local Caddy container, minimal Caddyfile reproducing ops/Caddyfile:31-35
/healthz     -> 200  body=ok
/HEALTHZ     -> 200  body=ok        <-- case-insensitive match
/HealthZ     -> 200  body=ok
/healthz2    -> 404

# Go regexp probe of the exact cloudflared pattern ops/cloudflared/config.yml.example:6
^/healthz$  vs  /healthz  -> matches = true
^/healthz$  vs  /HEALTHZ  -> matches = false   <-- deny rule does NOT fire
```

Composed: `/HEALTHZ` misses the tunnel deny rule → falls through to the hostname rule → reaches the
origin → Caddy matches case-insensitively → returns `ok` 200.

**Explicitly not claimed:** the end-to-end path was **not** tested against the live site — that is
forbidden by this goal. Both halves are proven locally; the composition is a sound inference from
them, and is labelled as such.

`ops/scripts/verify.sh:152` probes only lowercase `/healthz`, so the live verifier cannot catch it.
Impact is limited to leaking the literal `ok` and origin liveness — no visitor data, no corpus.
Severity is Medium because it violates a design-authority **must**, not because the leak is large.

### R-3 → **B-D-04** · `localeCompare` couples `assetManifestSha256` to an ICU table · `POSSIBLE_DEFECT_TO_VERIFY` (latent)

**SOURCE_DATE_EPOCH Specification**, reproducible-builds.org.
<https://reproducible-builds.org/specs/source-date-epoch/>

> The value "MUST be reproducible (deterministic) across different executions of the build,
> **depending only on the source code**."

**Stable order for outputs**, <https://reproducible-builds.org/docs/stable-outputs/> —
*"Beware that the locale settings might affect the output of some sorting functions."*

`scripts/build.ts:437-440` sorts `readdir` results with `left.name.localeCompare(right.name)`, and
that order reaches `assetManifestSha256` → `release.json`. `localeCompare` without an explicit locale
resolves against the ICU default locale.

**Tested, not asserted** (researcher, corroborated design): host Node 22.16.0 under `LC_ALL` of
`en_US.UTF-8` / `C` / `sv_SE.UTF-8` produced **identical** ordering, and the pinned Alpine builder
reports the same full-ICU 77.1 as the workstation. **Reproducibility is intact today.**

But the dependency is real: `release.json`'s hash currently depends on an **ICU collation table**
rather than on the source, which is exactly what the spec's "depending only on the source code"
targets. It would break silently on a Node/ICU bump, surfacing as an inexplicable hash drift during a
release rebuild.

**Deliberately NOT repaired in this audit** — see the ledger. A codepoint comparator is correct but
**changes `assetManifestSha256`**, i.e. it is a release-affecting change that must be sequenced with a
release that expects a hash change. Rule 17 also applies: it is Low, and it must not jump ahead of the
High. Recorded with the exact one-line remedy.

### R-4 → **B-D-05** · OCI reserved-namespace label · `POSSIBLE_DEFECT_TO_VERIFY`

**OCI Image Spec — Annotations**, <https://github.com/opencontainers/image-spec/blob/main/annotations.md>

> "Keys using the `org.opencontainers.image` namespace are reserved for use in the OCI Image
> Specification and **MUST NOT** be used by other specifications and extensions."

`ops/Dockerfile:52` defines `org.opencontainers.image.divan-build-mode` — a custom key inside the
reserved namespace. The repo already knows the correct pattern: `ops/compose.yml:78-79` uses
`org.persiansocietyeoi.divan.*`.

Spec hygiene, not security. **Coupled change:** the deployment runbook's
`docker inspect --format '{{index .Config.Labels "org.opencontainers.image.divan-build-mode"}}'` and
`tests/security/opsConfig.test.ts` would have to change in the same commit. Also worth recording
independently: **labels are builder-controlled metadata with no trust value** — the authoritative
production check is `ops/healthcheck/main.go`'s digest + 60/60/120 verification, which the repo
already does correctly.

---

## Findings verified and DOWNGRADED by the lead (recorded to prevent re-litigation)

The research pass flagged these as `POSSIBLE_DEFECT_TO_VERIFY`. The lead read the real code. They are
**not defects**, and this audit says so plainly rather than manufacturing findings.

| Hypothesis | Source | Lead verification | Verdict |
| ---------- | ------ | ----------------- | ------- |
| `randomBytes` + `%` reintroduces modulo bias in verse selection (CWE-1241/338) | Node crypto docs; ECMA-262 §21.3.2.28 | `src/lib/draw/secureRandom.ts:54-66` implements textbook **rejection sampling**: `limit = floor(2³²/max)*max`, rejects `value >= limit`, then `% max`. Unbiased by construction. | **ALREADY_SATISFIED** |
| `Math.random()` used in selection — spec grants *no* guarantee ("implementation-defined algorithm", only "approximately uniform") | ECMA-262 | `grep -rn "Math.random" src/ scripts/ src-sw/` → **zero occurrences**. | **ALREADY_SATISFIED** |
| Shell metacharacter injection via `exec()`/`shell:true` — Node's only bolded imperative: *"Never pass unsanitized user input to this function."* | Node child_process docs | Zero `exec(`, `shell: true`, or `execSync` in `scripts/`, `ops/`, `src/`, `src-sw/`. Every apparent hit is `RegExp.prototype.exec`. Only `execFileSync` (argument array) and `spawnSync` (argument array). | **ALREADY_SATISFIED** |
| `maxBuffer` default 1 MiB → child killed and output **truncated**, risking a truncated OCR result being content-addressed into `dist/` | Node child_process docs | The single `execFileSync` (`scripts/poetry/extract-sources.ts:62-74`) uses `stdio: 'inherit'` — **nothing is buffered**; the extractor writes to `--output` directly. | **NOT_APPLICABLE** |
| Argument injection via leading-dash filenames (CWE-88) — argument arrays do **not** fix this | MITRE CWE-88 (rev 4.20, 2026-04-30) | The only subprocess path passes `--input <path>` as an **option value**, and the path derives from `source.id`, schema-constrained by `IDENTIFIER_PATTERN`. No positional untrusted filename reaches argv. | **NOT_APPLICABLE** |
| Node 22.16.0 is 13 releases / 4 security releases behind (latest 22.23.1) | nodejs.org/dist/index.json; four security-release advisories | Module-by-module: every fs/crypto CVE is either a **permission-model bypass** (live only under `--permission`, which this repo does not use) or **network/TLS/HTTP** (no server, no runtime fetch). CVE-2025-27210 (`path.join`) is **Windows-only**; builds run macOS/linux-amd64. | **NOT_APPLICABLE — pin defensible on evidence.** Conditional: adopting `--permission` would make five bypasses live and invalidate this. |

---

## Confirmed-correct properties (`ALREADY_SATISFIED`, several stricter than required)

| Property | Source | Repository evidence |
| -------- | ------ | ------------------- |
| `respondWith` rejection → **network error**; resolution to a 503 → renders | W3C Service Workers, "If r rejected: set the potential response to a network error" | `src-sw/service-worker.ts:127-145` rescues **navigations only** with a served 503 and deliberately rethrows elsewhere so `/healthz` stays a true liveness probe. Both halves match the normative text. **Do not simplify this catch.** |
| `SOURCE_DATE_EPOCH` handling | reproducible-builds.org spec | `scripts/build.ts:239` **requires** it and refuses to build without it — the spec only says fall back to current time. Stricter than required. Validates integer/range/UTC, satisfying "SHOULD exit non-zero on malformed". `builtAt` derives from it, never `Date.now()`. |
| No env leakage into the browser bundle | Vite env docs; *"envPrefix should not be set as ''"* | `vite.config.ts` sets `envDir: false` (Vite never reads `.env` at all) **and** `envPrefix: 'DIVAN_BROWSER_PUBLIC_'`. Two independent mechanisms; the deny-listed `.env` cannot reach a bundle even by accident. |
| No source maps | Vite `build.sourcemap` default `false` | Set explicitly. Two structural backstops: a `.map` file would break `verify-dist.ts`'s exact-file-set check; an inline map would trip its `data:` rejection. |
| `publicDir: false` | Vite shared options | Correct — auto-copied `public/` files bypass the build graph, are never hashed, and would fail `verify-dist.ts` as "unexpected". `scripts/build.ts` allow-lists them explicitly. |
| Canonical JSON | RFC 8785 (JCS) key ordering + ES number serialisation | `src/lib/content/canonical.ts` sorts by UTF-16 code unit (`<`/`>`, matching JCS), rejects non-finite numbers, symbols, sparse arrays, extra array properties, non-plain prototypes and cycles. |
| Rumi span-overlap rejection | repo invariant | `productionManifest.ts:204-212` detects overlap **per Persian line** (NFC-normalised for comparison only, never for stored text) — genuine overlap detection, not just exact-duplicate detection. |
| Streaming SHA-256 | Node crypto docs' own worked example | Matches upstream's recommended idiom. Do **not** migrate to `crypto.hash()` — it is Stability 1.2 (RC) and its own docs steer back to `createHash` for streamed/large data. |
| `cap_drop: ALL`, `no-new-privileges`, `read_only`, numeric UID, no host port, `internal: true` web network | Compose spec | All set on both services. `divan-web` sits only on `divan_origin` (`internal: true`) — it **cannot egress** even if fully compromised. |
| `CMD` exec-form health check | Compose spec: *"the first item must be either NONE, CMD or CMD-SHELL"* | `compose.yml:22` uses `['CMD', …]` — the **only** correct form for `scratch` (CMD-SHELL would need `/bin/sh`, which does not exist). Do not "simplify" to a string. |
| Caddy `route` wrappers | Caddy directive order: `respond` (28) precedes `file_server` (31) | Lines 61-67 / 85-91 wrap in `route` to preserve literal order. **Without `route`, every request in those handles would 404.** Do not remove. |
| No `try_files` SPA fallback | — | `@documents` is an explicit six-path allowlist, and `@staticAssets` is handled first, so a missing asset yields a real 404 rather than the shell. Materially better than the common `try_files` idiom. |
| Caddy v2.11.4 | GHSA-j8px-rmrx-76h9 (published 2026-07-10; patched in 2.11.4, released 2026-06-03) | **Not affected.** A late-published advisory, not an unpatched hole. `admin off` independently neutralises two further advisory classes. |
| Go 1.26.5 | go.dev release history | Pinned to the **current latest** (2026-07-07). Rebuilding Caddy v2.11.4 with it genuinely picks up `crypto/tls`/`os`/`x509` fixes the official image (built pre-1.26.4) cannot have — the Dockerfile's stated rationale is independently confirmed. |
| `CGO_ENABLED=0`, `GOTOOLCHAIN=local`, `-trimpath -buildid=` | Go/BuildKit docs | Required for `scratch` (static binary, pure-Go resolver) and for reproducibility. |
| `redirect: 'error'` | WHATWG Fetch: *"Return a network error when a request is met with a redirect"* | Used at `releaseManager.ts:225,594,796,871`. Correct for content-addressed bytes: a redirect on `/content/<sha>.json` means the bytes came from somewhere other than the digest-named path. Also structurally prevents **opaque** responses (status 0, null body) — which are storable but **unhashable**. |
| Message-gated `skipWaiting` | web.dev SW lifecycle: *"If this might break things, don't use skipWaiting()"* | Not called from `install`; only from a strictly-validated `ACTIVATE_READY_RELEASE` message, **after** `activateRelease()` and a pointer read-back assertion. The mixed-version hazard is structurally avoided, not merely mitigated. |
| Stage → verify → atomic pointer switch | Cache API grants **no** cross-key atomicity | The repo implements the standard compensating pattern: the only indivisible step is the single pointer write. Correct architecture. |
| Build args are public provenance | Docker: *"Build arguments and environment variables are inappropriate for passing secrets… they persist in the final image"* | All seven `ARG`s are non-secret build provenance and `ops/Dockerfile:17-18` states this as a rule. **No credential is passed as a build arg.** Values are recoverable via `docker history` — which is fine, because none is secret. |

---

## Recommendations recorded but NOT actioned (with the reason)

| Item | Class | Why not actioned here |
| ---- | ----- | --------------------- |
| `caddy validate` in the build stage | RECOMMENDED | Real cheap win (shifts a malformed-Caddyfile failure from container start to build). But it is an **enhancement**, not a defect, and rule 17 forbids low-value work while a High is open. Recorded for a follow-up. |
| `build.rollupOptions` → `build.rolldownOptions` | RECOMMENDED | Vite 8 is Rolldown-based; `rollupOptions` is a documented **deprecated alias** that still works via auto-conversion. A rename with no behaviour change — not a defect. |
| Egress allowlist for `divan_egress` | RECOMMENDED | Compose has **no egress-filtering primitive**; this needs host nftables/iptables, i.e. live infrastructure — out of scope by instruction. Recorded so the isolation claim is stated precisely: *"divan-web cannot egress"*, **not** *"the stack cannot egress."* |
| HSTS preload | NOT recommended | `includeSubDomains` would force every subdomain of `raoufabedini.dev` — including the unrelated EOI/nexus services — onto HTTPS-only, with 6–12 month removal latency. Poor cost/benefit for a time-boxed stall. Actively advise against. |
| COEP | NOT_APPLICABLE | Only needed for cross-origin isolation (`SharedArrayBuffer`). `require-corp` would risk breaking the `blob:` share path for zero benefit. A scanner flagging "missing COEP" here is a **false positive**. |
| `--permission` sandboxing for build scripts | NOT recommended | Would make **five** Node 22.16.0 permission-model bypass CVEs live. The version pin and this recommendation are coupled. |

## Documentation-accuracy findings

1. **`ops/Caddyfile:73-74` overclaims.** It asserts *"RFC 9111 no-transform forbids that rewrite at
   every intermediary, and Cloudflare honours it."* The first clause is exactly right. The second is
   an **inference**: Cloudflare's only published statement (Web Analytics FAQ) describes
   `Cache-Control: public, no-transform` — and this file sends `no-cache, must-revalidate, no-transform`,
   without `public`. By RFC 9111 the repo is unambiguously correct (`no-transform` is independent of
   `public`); whether Cloudflare's edge keys on the token or on that literal documented string is
   **not documented either way**. Given the repo's "never claim evidence that wasn't obtained" rule,
   the comment should state RFC-normative + *observed* behaviour (v1.0.6 evidence records it observed
   working) rather than assert Cloudflare's conformance. **Do not speculatively add `public`** — it
   changes shared-cache semantics for the HTML shell.
2. **cloudflared default log content was not verified.** `--loglevel error` is set and is
   directionally right, but no primary Cloudflare source enumerating loglevels or default log content
   was located. Any privacy write-up must say so rather than assert it.
3. **`verify:privacy` cannot see an edge-injected beacon** — by construction, injection happens after
   bytes leave the origin. Only a live fetch with a real (non-bot) user agent can prove absence. This
   is a real blind spot in the verification chain and is why the v1.0.6 `curl`-based evidence was
   structurally blind.
