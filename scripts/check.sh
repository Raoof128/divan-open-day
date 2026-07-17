#!/usr/bin/env bash
#
# DIVAN quality gate. Runs the local verification gauntlet (design §30.1) and
# reports every step. Hard gates must pass; remaining external launch gates are
# reported as status until their independent evidence exists.
#
# Usage:
#   scripts/check.sh            full gate (no browser e2e, no Docker)
#   scripts/check.sh --quick    fast gate: format, lint, typecheck, unit tests
#   scripts/check.sh --e2e      also run Playwright end-to-end tests
#   scripts/check.sh --ci       CI mode: includes --e2e, no colour
#
set -uo pipefail
cd "$(dirname -- "${BASH_SOURCE[0]}")/.." || exit 2

QUICK=0
E2E=0
CI=0
for arg in "$@"; do
  case "$arg" in
    --quick) QUICK=1 ;;
    --e2e) E2E=1 ;;
    --ci) CI=1; E2E=1 ;;
    -h | --help) sed -n '3,14p' "$0"; exit 0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

if [[ -t 1 && "$CI" -eq 0 ]]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  BOLD=''; RED=''; GREEN=''; YELLOW=''; DIM=''; RESET=''
fi

FAILURES=()

production_build() {
  env \
    DIVAN_PUBLIC_ORIGIN='https://divan.raoufabedini.dev' \
    DIVAN_RELEASE_ID='ci-production-verification' \
    DIVAN_MIN_HAFEZ_COUNT='60' \
    DIVAN_MIN_RUMI_COUNT='60' \
    DIVAN_BRANDING_MODE='society_only' \
    DIVAN_UNIVERSITY_APPROVAL_ID='' \
    SOURCE_DATE_EPOCH="$(git log -1 --format=%ct)" \
    pnpm -s build:production
}

dependency_audit() {
  if [[ "${DIVAN_OSV_SCAN_COMPLETED:-0}" == 1 ]]; then
    printf '%s\n' 'OSV dependency scan completed by the required CI job.'
    return 0
  fi

  if command -v osv-scanner >/dev/null 2>&1; then
    osv-scanner scan source --lockfile pnpm-lock.yaml --format table
    return
  fi

  pnpm audit --prod
}

# Hard gate: failure fails the whole check (collected, reported at the end).
step() {
  local name="$1"; shift
  printf '%s▸ %s%s\n' "$BOLD" "$name" "$RESET"
  local start; start=$SECONDS
  if "$@"; then
    printf '  %s✓ %s%s %s(%ss)%s\n' "$GREEN" "$name" "$RESET" "$DIM" "$((SECONDS - start))" "$RESET"
  else
    printf '  %s✗ %s%s\n' "$RED" "$name" "$RESET"
    FAILURES+=("$name")
  fi
}

# Launch gate: expected to be fail-closed. A zero exit means a gate opened.
#
# A non-zero exit alone is NOT evidence of a healthy closed gate: the verifier
# exits non-zero both when it genuinely blocks and when it dies on argv, a
# missing interpreter, or a syntax error. This gate previously reported
# "fail-closed (as intended)" for `Usage: verify-qr.ts --pack <directory>` —
# it never reached a single manifest, checksum, vector or PDF check, and would
# have reported the same had the script been deleted. So the gate must also
# prove the verifier actually ran, by matching a marker only it can print.
gate_closed() {
  local name="$1"; local expected_reason="$2"; shift 2
  printf '%s▸ %s %s(expect fail-closed)%s\n' "$BOLD" "$name" "$DIM" "$RESET"
  local output rc
  output=$("$@" 2>&1)
  rc=$?
  if [[ "$rc" -eq 0 ]]; then
    printf '  %s✗ %s unexpectedly succeeded — a launch gate opened%s\n' "$RED" "$name" "$RESET"
    FAILURES+=("$name (gate opened)")
  elif [[ "$output" != *"$expected_reason"* ]]; then
    printf '  %s✗ %s exited non-zero without reaching its own contract; expected %s in the output%s\n' \
      "$RED" "$name" "$expected_reason" "$RESET"
    printf '  %s%s%s\n' "$DIM" "$output" "$RESET"
    FAILURES+=("$name (closed for the wrong reason)")
  else
    printf '  %s✓ %s is fail-closed (as intended)%s\n' "$GREEN" "$name" "$RESET"
  fi
}

echo "${BOLD}DIVAN quality gate${RESET} ${DIM}(node $(node -v))${RESET}"
echo

step 'format:check' pnpm -s format:check
step 'lint' pnpm -s lint
step 'typecheck' pnpm -s typecheck
step 'test (unit/component/a11y/offline/share/perf/security)' pnpm -s test

if [[ "$QUICK" -eq 0 ]]; then
  step 'build:fixture' pnpm -s build:fixture
  step 'verify:dist' pnpm -s verify:dist
  step 'verify:privacy' pnpm -s verify:privacy
  step 'audit (prod deps)' dependency_audit
  step 'build:production' production_build

  if [[ "$E2E" -eq 1 ]]; then
    step 'test:e2e (Playwright)' pnpm -s test:e2e
  else
    printf '%s▸ test:e2e%s %s(skipped — pass --e2e)%s\n' "$BOLD" "$RESET" "$DIM" "$RESET"
  fi

  echo
  echo "${BOLD}Launch gates${RESET} ${DIM}(must stay closed until evidence exists)${RESET}"
  # `--pack` is required: without it the verifier dies on argv and the gate
  # proves nothing about the QR deliverable. `docs/qr` is where generate:qr
  # writes the pack; while it does not exist the verifier reports that honestly.
  gate_closed 'verify:qr' 'Digital QR pack:' pnpm -s verify:qr --pack docs/qr

  if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
    printf '%s▸ Docker evidence%s %s(skipped — no running daemon; run ops/scripts/verify.sh on a Docker host)%s\n' \
      "$BOLD" "$RESET" "$YELLOW" "$RESET"
  fi
fi

echo
if [[ "${#FAILURES[@]}" -eq 0 ]]; then
  echo "${GREEN}${BOLD}✓ quality gate passed${RESET}"
  exit 0
fi
echo "${RED}${BOLD}✗ quality gate failed:${RESET} ${FAILURES[*]}"
exit 1
