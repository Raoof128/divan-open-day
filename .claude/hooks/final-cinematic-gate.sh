#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT="${CLAUDE_PROJECT_DIR:-$PWD}"
RUNTIME="$PROJECT/.claude/runtime"
ARMED="$RUNTIME/release-gate-armed.json"
PASS="$RUNTIME/release-gate-pass.json"
BLOCK="$RUNTIME/release-gate-last-block.json"
INPUT="$(cat || true)"
[[ -f "$ARMED" ]] || exit 0

CURRENT_HASH="$(node "$PROJECT/.claude/scripts/worktree-state-hash.mjs")"
if [[ -s "$PASS" ]] && node - "$PASS" "$CURRENT_HASH" <<'NODE'
const fs=require("fs");const [p,h]=process.argv.slice(2);try{const x=JSON.parse(fs.readFileSync(p,"utf8"));process.exit(x.worktreeStateSha256===h&&x.status.startsWith("PASS")?0:1)}catch{process.exit(1)}
NODE
then rm -f "$ARMED" "$BLOCK"; exit 0; fi

STOP_ACTIVE="$(printf '%s' "$INPUT" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{process.stdout.write(JSON.parse(d||"{}").stop_hook_active?"true":"false")}catch{process.stdout.write("false")}})')"
if [[ "$STOP_ACTIVE" == "true" ]]; then exit 0; fi
if [[ -s "$BLOCK" ]] && node - "$BLOCK" "$CURRENT_HASH" <<'NODE'
const fs=require("fs");const [p,h]=process.argv.slice(2);try{process.exit(JSON.parse(fs.readFileSync(p,"utf8")).worktreeStateSha256===h?0:1)}catch{process.exit(1)}
NODE
then exit 0; fi
mkdir -p "$RUNTIME"
printf '{"worktreeStateSha256":"%s","blockedAt":"%s"}\n' "$CURRENT_HASH" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$BLOCK"
REASON="The DIVAN release gate is armed but no fresh PASS evidence matches the current worktree. Run bash .claude/scripts/run-divan-gate.sh, fix the report in .claude/runtime/release-gate.log, then try completion again."
node - "$REASON" <<'NODE'
process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"Stop",additionalContext:process.argv[2]}}));
NODE
