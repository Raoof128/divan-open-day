#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

export function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

export function loadProjectConfig(root = projectRoot()) {
  const p = path.join(root, ".claude", "divan-project.json");
  if (!fs.existsSync(p)) throw new Error(`Missing ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function normaliseRelative(value, root = projectRoot()) {
  const absolute = path.resolve(root, value || "");
  const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
  if (relative === "" || relative === ".") return "";
  if (relative.startsWith("../") || path.isAbsolute(relative)) throw new Error(`Path escapes repository: ${value}`);
  return relative;
}

export function protectedRoots(config) {
  const values=[...new Set((config.protectedPaths || []).map(v => String(v).replace(/^\.\//, "").replace(/\/$/, "")))].filter(Boolean);
  for (const value of values) {
    const clean=value.replaceAll("\\","/");
    if (path.posix.isAbsolute(clean) || clean.split("/").includes("..")) throw new Error(`Invalid protected path: ${value}`);
  }
  return values;
}

export function isProtected(relative, config) {
  const clean = String(relative || "").replace(/^\.\//, "").replaceAll("\\", "/");
  return protectedRoots(config).some(root => clean === root || clean.startsWith(`${root}/`));
}

export function isMutatingBash(command) {
  const cmd = String(command || "");
  const mutator = /(^|[;&|]\s*|\s)(rm|mv|cp|install|mkdir|rmdir|touch|truncate|tee|sed\s+-i|perl\s+-i|python(?:3)?\s+-c|node\s+-e|git\s+(?:checkout|restore|clean|reset|apply)|cat\s+[^|;]*>|echo\s+[^|;]*>|printf\s+[^|;]*>)/i;
  return mutator.test(cmd);
}

export function mutatingBashMentionsProtected(command, config) {
  const cmd = String(command || "");
  if (!isMutatingBash(cmd)) return false;
  return protectedRoots(config).some(root => cmd.includes(root));
}
