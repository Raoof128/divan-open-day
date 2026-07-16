#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$PROJECT"
RUNTIME="$PROJECT/.claude/runtime"; mkdir -p "$RUNTIME"
[[ -f "$RUNTIME/cinematic-task-active.json" ]] || { echo "Cinematic task mode is not active. Run activate-cinematic-task.sh." >&2; exit 2; }
LOG="$RUNTIME/release-gate.log"; REPORT="$RUNTIME/release-gate-report.json"; PASS="$RUNTIME/release-gate-pass.json"
: > "$LOG"; rm -f "$PASS"
exec > >(tee -a "$LOG") 2>&1
node .claude/scripts/validate-pack.mjs
node .claude/scripts/check-protected-diff.mjs
node .claude/scripts/check-media-budget.mjs
node .claude/scripts/check-verification-report.mjs
node - <<'NODE'
const fs=require("fs"),{spawnSync}=require("child_process"),crypto=require("crypto"),path=require("path");
const root=process.cwd(),cfg=JSON.parse(fs.readFileSync(".claude/divan-project.json","utf8"));
if(cfg.releaseGateEnabled!==true){console.error("releaseGateEnabled is false. Review commands and set it true only for final verification.");process.exit(2)}
const required=["format","lint","typecheck","test","build"], results=[];let failed=false;
for(const id of required.concat(["accessibility","e2e","visual","offline"])) {const cmd=cfg.commands?.[id];if(!cmd){if(required.includes(id)){console.error(`Missing required command ${id}`);failed=true}continue;}const [program,...args]=cmd;console.log(`\n=== ${id}\n$ ${cmd.join(" ")}`);const r=spawnSync(program,args,{cwd:root,encoding:"utf8",stdio:"inherit"});results.push({id,command:cmd,status:r.status??1});if((r.status??1)!==0)failed=true;}
const report={schemaVersion:1,status:failed?"FAIL":"PASS",completedAt:new Date().toISOString(),results};fs.writeFileSync(".claude/runtime/release-gate-report.json",JSON.stringify(report,null,2)+"\n");if(failed)process.exit(1);
NODE
node .claude/scripts/check-protected-diff.mjs
HEAD_SHA="$(git rev-parse HEAD 2>/dev/null || true)"
WORKTREE_HASH="$(node .claude/scripts/worktree-state-hash.mjs)"
REPORT_HASH="$(node - "$REPORT" <<'NODE'
const fs=require("fs"),crypto=require("crypto");process.stdout.write(crypto.createHash("sha256").update(fs.readFileSync(process.argv[2])).digest("hex"));
NODE
)"
LOG_HASH="$(node - "$LOG" <<'NODE'
const fs=require("fs"),crypto=require("crypto");process.stdout.write(crypto.createHash("sha256").update(fs.readFileSync(process.argv[2])).digest("hex"));
NODE
)"
printf '{"schemaVersion":1,"status":"PASS","completedAt":"%s","head":"%s","worktreeStateSha256":"%s","reportSha256":"%s","logSha256":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$HEAD_SHA" "$WORKTREE_HASH" "$REPORT_HASH" "$LOG_HASH" > "$PASS"
printf '{"createdAt":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$RUNTIME/preserve-pass-once.json"
echo "DIVAN release gate PASS."
