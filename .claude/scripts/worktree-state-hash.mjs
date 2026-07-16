#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root=process.env.CLAUDE_PROJECT_DIR||process.cwd();
const h=crypto.createHash("sha256");
function git(args){try{return execFileSync("git",args,{cwd:root});}catch{return Buffer.from("");}}
h.update(git(["rev-parse","HEAD"]));
h.update(git(["diff","--binary","HEAD"]));
h.update(git(["diff","--binary","--cached"]));
const untracked=git(["ls-files","--others","--exclude-standard","-z"]).toString("utf8").split("\0").filter(Boolean).sort();
for(const rel of untracked){h.update(rel);const p=path.join(root,rel);if(fs.existsSync(p)){const st=fs.lstatSync(p);if(st.isSymbolicLink())h.update(fs.readlinkSync(p));else if(st.isFile())h.update(fs.readFileSync(p));}}
process.stdout.write(h.digest("hex"));
