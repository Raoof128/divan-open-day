#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadProjectConfig, protectedRoots, projectRoot } from "./path-policy.mjs";

const root = projectRoot();
const config = loadProjectConfig(root);
const out = path.join(root, ".claude", "runtime", "protected-baseline.json");
fs.mkdirSync(path.dirname(out), { recursive: true });

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function walk(dir, acc=[]) {
  if (!fs.existsSync(dir)) return acc;
  const st=fs.lstatSync(dir);
  if (st.isSymbolicLink()) { acc.push(dir); return acc; }
  if (st.isFile()) { acc.push(dir); return acc; }
  for (const e of fs.readdirSync(dir).sort()) walk(path.join(dir,e),acc);
  return acc;
}
const files = new Set();
for (const relRoot of protectedRoots(config)) for (const file of walk(path.join(root, relRoot))) files.add(file);
try {
  const listed=execFileSync("git",["ls-files","-co","--exclude-standard","-z","--",...protectedRoots(config)],{cwd:root});
  for (const rel of listed.toString("utf8").split("\0").filter(Boolean)) {
    const file=path.join(root,rel); if (fs.existsSync(file) && fs.lstatSync(file).isFile()) files.add(file);
  }
} catch {}
const records=[...files].sort().map(file=>({
  path:path.relative(root,file).replaceAll(path.sep,"/"),
  type:fs.lstatSync(file).isSymbolicLink()?"symlink":"file",
  bytes:fs.lstatSync(file).isSymbolicLink()?0:fs.statSync(file).size,
  sha256:fs.lstatSync(file).isSymbolicLink()?crypto.createHash("sha256").update(fs.readlinkSync(file)).digest("hex"):hashFile(file)
}));
const baseline={schemaVersion:1,capturedAt:new Date().toISOString(),protectedRoots:protectedRoots(config),records};
fs.writeFileSync(out,JSON.stringify(baseline,null,2)+"\n");
console.log(`Captured ${records.length} protected files in ${path.relative(root,out)}`);
