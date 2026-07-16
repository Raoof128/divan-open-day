#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadProjectConfig, protectedRoots, projectRoot } from "./path-policy.mjs";

const root=projectRoot();
const config=loadProjectConfig(root);
const baselinePath=path.join(root,".claude","runtime","protected-baseline.json");
if (!fs.existsSync(baselinePath)) { console.error("Protected baseline missing. Run capture-protected-baseline.mjs."); process.exit(2); }
const baseline=JSON.parse(fs.readFileSync(baselinePath,"utf8"));
const current=new Map();
function walk(dir,acc=[]) { if(!fs.existsSync(dir))return acc; const st=fs.lstatSync(dir); if(st.isSymbolicLink()||st.isFile()){acc.push(dir);return acc;} for(const e of fs.readdirSync(dir).sort())walk(path.join(dir,e),acc); return acc; }
function rec(file){const st=fs.lstatSync(file); const symlink=st.isSymbolicLink(); return {path:path.relative(root,file).replaceAll(path.sep,"/"),type:symlink?"symlink":"file",bytes:symlink?0:st.size,sha256:crypto.createHash("sha256").update(symlink?fs.readlinkSync(file):fs.readFileSync(file)).digest("hex")};}
for(const r of protectedRoots(config)) for(const f of walk(path.join(root,r))) current.set(rec(f).path,rec(f));
const expected=new Map((baseline.records||[]).map(r=>[r.path,r]));
const changes=[];
for(const [p,e] of expected){const c=current.get(p); if(!c)changes.push(`deleted ${p}`); else if(c.sha256!==e.sha256||c.bytes!==e.bytes||c.type!==e.type)changes.push(`changed ${p}`);}
for(const p of current.keys()) if(!expected.has(p)) changes.push(`added ${p}`);
if(changes.length){console.error("Protected-content baseline changed:\n"+changes.map(x=>`- ${x}`).join("\n"));process.exit(1);}
console.log(`Protected-content baseline PASS (${expected.size} files).`);
