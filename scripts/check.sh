#!/usr/bin/env bash
#
# DIVAN quality gate. Runs the local verification gauntlet (design §30.1) and
# reports every step. Hard gates must pass; launch gates are reported as status
# (they are deliberately fail-closed until human/production evidence exists).
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

# Launch gate: expected to be fail-closed. Non-zero exit is the healthy state;
# a zero exit means a gate opened and is surfaced as a failure.
gate_closed() {
  local name="$1"; shift
  printf '%s▸ %s %s(expect fail-closed)%s\n' "$BOLD" "$name" "$DIM" "$RESET"
  if "$@" >/dev/null 2>&1; then
    printf '  %s✗ %s unexpectedly succeeded — a launch gate opened%s\n' "$RED" "$name" "$RESET"
    FAILURES+=("$name (gate opened)")
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
  step 'audit (prod deps)' pnpm audit --prod

  if [[ "$E2E" -eq 1 ]]; then
    step 'test:e2e (Playwright)' pnpm -s test:e2e
  else
    printf '%s▸ test:e2e%s %s(skipped — pass --e2e)%s\n' "$BOLD" "$RESET" "$DIM" "$RESET"
  fi

  echo
  echo "${BOLD}Launch gates${RESET} ${DIM}(must stay closed until evidence exists)${RESET}"
  gate_closed 'build:production' pnpm -s build:production
  gate_closed 'verify:qr' pnpm -s verify:qr

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
