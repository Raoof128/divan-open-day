#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$PROJECT"
RUNTIME="$PROJECT/.claude/runtime"; mkdir -p "$RUNTIME"
node .claude/scripts/capture-protected-baseline.mjs
printf '{"activatedAt":"%s","worktree":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PROJECT" > "$RUNTIME/cinematic-task-active.json"
echo "DIVAN cinematic task protection active in this worktree."
