#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT="${CLAUDE_PROJECT_DIR:-$PWD}"
rm -f "$PROJECT/.claude/runtime/cinematic-task-active.json"
echo "DIVAN cinematic task protection inactive in this worktree."
