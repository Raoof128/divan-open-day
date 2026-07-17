# Backend audit — Phase 4 baseline

All gates run fresh on `adde8b4` BEFORE any repair. Node 22.16.0 / pnpm 10.33.0 / tsc 6.0.3 / vite 8.1.4 / vitest 4.1.10 / Docker 29.6.1.
**shellcheck: UNAVAILABLE on this machine** — recorded, not skipped silently.

| Command | Exit | Duration (s) |
| --- | --- | --- |
| `pnpm install` | 0 | 1 |
| `pnpm format:check` | 0 | 3 |
| `pnpm lint` | 0 | 7 |
| `pnpm typecheck` | 0 | 5 |
| `pnpm test:unit` | 0 | 2 |
| `pnpm test:content` | 0 | 11 |
| `pnpm test:offline` | 0 | 2 |
| `pnpm test:security` | 0 | 9 |
| `pnpm test:performance` | 0 | 1 |
| `pnpm poetry:verify-sources` | 0 | 0 |
| `pnpm build:fixture` | 0 | 1 |
| `pnpm verify:privacy` | 0 | 1 |
| `pnpm verify:container` | 0 | 1 |
| `pnpm verify:headers` | 0 | 2 |
| `pnpm verify:origin-isolation` | 0 | 2 |
| `pnpm verify:rollback` | 0 | 8 |
| `pnpm verify:qr` | 1 | 1 |

**CORRECTION (round 2).** This baseline originally recorded `verify:qr` (exit 1) as "fail-closed by design — a launch gate, not a defect". That was inferred from the exit code, and it was wrong. The full read proved the script dies at argv validation (`Digital QR pack: FAIL — Usage: verify-qr.ts --pack <directory>`) because `verify:qr` was wired without `--pack`; it never reached a single manifest, checksum, vector or PDF check. The exit code was real; the reason I attributed to it was not. This is the same error `gate_closed` was making, and it is recorded here rather than quietly amended — see B-D-23. No other baseline failure predates the audit. `pnpm audit --prod` also passes (exit 0), contradicting the CHANGELOG's HTTP 410 record.
