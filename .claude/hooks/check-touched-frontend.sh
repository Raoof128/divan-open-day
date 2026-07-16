#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT="${CLAUDE_PROJECT_DIR:-$PWD}"
RUNTIME="$PROJECT/.claude/runtime"
[[ -f "$RUNTIME/cinematic-task-active.json" ]] || exit 0
mkdir -p "$RUNTIME"
INPUT="$(cat || true)"
TOOL_NAME="$(printf '%s' "$INPUT" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{process.stdout.write(JSON.parse(d||"{}").tool_name||"")}catch{}})')"
TOOL_COMMAND="$(printf '%s' "$INPUT" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{const x=JSON.parse(d||"{}");process.stdout.write(x?.tool_input?.command||"")}catch{}})')"
PRESERVE=false
if [[ "$TOOL_NAME" == "Bash" && -f "$RUNTIME/preserve-pass-once.json" && -f "$RUNTIME/release-gate-pass.json" ]]; then
  case "$TOOL_COMMAND" in
    "bash .claude/scripts/run-divan-gate.sh"|".claude/scripts/run-divan-gate.sh"|"bash ${PROJECT}/.claude/scripts/run-divan-gate.sh"|"${PROJECT}/.claude/scripts/run-divan-gate.sh") PRESERVE=true ;;
  esac
fi
if [[ "$PRESERVE" == "true" ]]; then
  rm -f "$RUNTIME/preserve-pass-once.json"
else
  rm -f "$RUNTIME/release-gate-pass.json" "$RUNTIME/preserve-pass-once.json"
fi

BASELINE_MSG=""
if [[ -f "$RUNTIME/protected-baseline.json" ]]; then
  if ! OUT="$(node "$PROJECT/.claude/scripts/check-protected-diff.mjs" 2>&1)"; then BASELINE_MSG="$OUT"; fi
fi

FILE_PATH="$(printf '%s' "$INPUT" | node -e 'const path=require("path");let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{const x=JSON.parse(d||"{}");const v=x?.tool_input?.file_path||x?.tool_input?.path||"";process.stdout.write(v?(path.isAbsolute(v)?v:path.resolve(x.cwd||process.cwd(),v)):"")}catch{}})')"
FORMAT_MSG=""
if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "Write" ]] && [[ -n "$FILE_PATH" && -f "$FILE_PATH" ]]; then
  case "$FILE_PATH" in "$PROJECT"/*) ;; *) FILE_PATH="";; esac
  case "$FILE_PATH" in *.js|*.jsx|*.mjs|*.cjs|*.ts|*.tsx|*.css|*.scss|*.sass|*.html|*.json|*.md|*.mdx|*.yaml|*.yml)
    PRETTIER="$PROJECT/node_modules/.bin/prettier"
    if [[ -x "$PRETTIER" ]] && ! OUT="$($PRETTIER --check "$FILE_PATH" 2>&1)"; then FORMAT_MSG="$OUT"; fi
  ;; esac
fi

MESSAGE=""
[[ -z "$BASELINE_MSG" ]] || MESSAGE+="Protected-content drift detected. Restore it before continuing. ${BASELINE_MSG} "
[[ -z "$FORMAT_MSG" ]] || MESSAGE+="The touched file failed local Prettier. Repair only that file. ${FORMAT_MSG}"
if [[ -n "$MESSAGE" ]]; then
  node - "$MESSAGE" <<'NODE'
const message=process.argv[2].slice(0,7000);
process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:message}}));
NODE
fi
