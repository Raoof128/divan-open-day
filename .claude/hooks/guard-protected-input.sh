#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT="${CLAUDE_PROJECT_DIR:-$PWD}"
[[ -f "$PROJECT/.claude/runtime/cinematic-task-active.json" ]] || exit 0
exec node "$PROJECT/.claude/scripts/guard-tool-input.mjs"
