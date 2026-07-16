#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT="${CLAUDE_PROJECT_DIR:-$PWD}"
RUNTIME="$PROJECT/.claude/runtime"; mkdir -p "$RUNTIME"
printf '{"armedAt":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$RUNTIME/release-gate-armed.json"
rm -f "$RUNTIME/release-gate-pass.json" "$RUNTIME/release-gate-last-block.json"
echo "DIVAN release gate armed. Run bash .claude/scripts/run-divan-gate.sh before completion."
