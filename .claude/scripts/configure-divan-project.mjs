#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root=process.cwd();
const packageFile=path.join(root,"package.json");
if(!fs.existsSync(packageFile)){console.error("Run from a repository root containing package.json.");process.exit(2);}
const pkg=JSON.parse(fs.readFileSync(packageFile,"utf8"));
const scripts=pkg.scripts||{};const deps={...(pkg.dependencies||{}),...(pkg.devDependencies||{})};
let pm=(pkg.packageManager||"").split("@")[0];
if(!pm)pm=fs.existsSync("pnpm-lock.yaml")?"pnpm":fs.existsSync("yarn.lock")?"yarn":fs.existsSync("bun.lock")||fs.existsSync("bun.lockb")?"bun":"npm";
const runScript=n=>pm==="npm"?["npm","run",n]:pm==="bun"?["bun","run",n]:[pm,n];
const bin=(n,args=[])=>{const p=path.join(root,"node_modules",".bin",process.platform==="win32"?`${n}.cmd`:n);return fs.existsSync(p)?[p,...args]:null};
const firstScript=names=>{const n=names.find(x=>Object.hasOwn(scripts,x));return n?runScript(n):null};
const commands={
 format:firstScript(["format:check","check:format","format-check"])||(deps.prettier?bin("prettier",["--check","."]):null),
 lint:firstScript(["lint","check:lint"])||(deps.eslint?bin("eslint",["."]):null),
 typecheck:firstScript(["typecheck","type-check","check:types","check:ts"])||(deps.typescript?bin("tsc",["--noEmit"]):null),
 test:firstScript(["test:run","test","check:test"])||(deps.vitest?bin("vitest",["run"]):deps.jest?bin("jest",["--runInBand"]):null),
 accessibility:firstScript(["test:a11y","a11y","check:a11y"]),
 e2e:firstScript(["test:e2e","e2e","check:e2e"]),
 visual:firstScript(["test:visual","visual:test","check:visual"]),
 offline:firstScript(["test:offline","check:offline"]),
 build:firstScript(["build:production","build","build:prod"])||(deps.vite?bin("vite",["build"]):null)
};
const cfgPath=path.join(root,".claude","divan-project.json");
const prior=fs.existsSync(cfgPath)?JSON.parse(fs.readFileSync(cfgPath,"utf8")):{};
const cfg={...prior,schemaVersion:1,releaseGateEnabled:false,packageManager:pm,commands,generatedAt:new Date().toISOString()};
fs.writeFileSync(cfgPath,JSON.stringify(cfg,null,2)+"\n");
console.log(`Wrote ${path.relative(root,cfgPath)} with releaseGateEnabled=false.`);
for(const [k,v] of Object.entries(commands))console.log(`${k}: ${v?JSON.stringify(v):"UNRESOLVED"}`);
const missing=["format","lint","typecheck","test","build"].filter(k=>!commands[k]);
if(missing.length){console.error(`Review and supply commands for: ${missing.join(", ")}`);process.exitCode=2;}
