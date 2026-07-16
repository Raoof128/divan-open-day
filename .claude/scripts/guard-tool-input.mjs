#!/usr/bin/env node
import path from "node:path";
import { loadProjectConfig, isProtected, isMutatingBash, mutatingBashMentionsProtected, normaliseRelative, projectRoot } from "./path-policy.mjs";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let input = {};
try { input = JSON.parse(raw || "{}"); } catch { process.exit(0); }
const root = projectRoot();
const config = loadProjectConfig(root);
const name = input.tool_name || "";
const tool = input.tool_input || {};
const hookCwd = input.cwd || root;
let reason = "";

if (name === "Edit" || name === "Write") {
  const candidate = tool.file_path || tool.path || "";
  if (candidate) {
    try {
      const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(hookCwd, candidate);
      const rel = normaliseRelative(resolved, root);
      if (isProtected(rel, config)) reason = `Protected DIVAN path cannot be edited by the cinematic task: ${rel}`;
    } catch (error) { reason = error.message; }
  }
}
if (name === "Bash") {
  let cwdProtected=false;
  try { cwdProtected=isProtected(normaliseRelative(hookCwd, root), config); } catch {}
  if (mutatingBashMentionsProtected(tool.command, config) || (cwdProtected && isMutatingBash(tool.command))) {
    reason = "The Bash command appears to mutate a protected poetry, private-source, ballot, or EOI path. Use a frontend-only command or update the reviewed path policy first.";
  }
}

if (reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason
    }
  }));
}
