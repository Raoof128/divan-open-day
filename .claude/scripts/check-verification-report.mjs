#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const cfg=JSON.parse(fs.readFileSync(path.join(root,".claude","divan-project.json"),"utf8"));
const file=path.resolve(root,cfg.verificationReport);if(!file.startsWith(root+path.sep)){console.error("verificationReport path escapes repository");process.exit(2);}
if(fs.existsSync(file)){const lst=fs.lstatSync(file);if(lst.isSymbolicLink()||!lst.isFile()||!fs.realpathSync(file).startsWith(fs.realpathSync(root)+path.sep)){console.error("verificationReport must be a regular in-repository file");process.exit(2);}}
if(!fs.existsSync(file)){console.error(`Missing ${cfg.verificationReport}. Copy .claude/templates/divan-cinematic-enhancement-report.md first.`);process.exit(2);}
const text=fs.readFileSync(file,"utf8");
const headings=["Repository state","Changed files","Asset integrity","Commands and results","Accessibility","Performance","Privacy and security","Offline and failure paths","Rollback","Final verdict"];
const failures=[];
if(!text.startsWith("# DIVAN Cinematic Enhancement Verification Report"))failures.push("incorrect H1");
const completed=text.match(/Completed at:\s*(\d{4}-\d{2}-\d{2}T[^\s]+)/)?.[1];
if(!completed||Number.isNaN(Date.parse(completed)))failures.push("missing valid Completed at ISO timestamp");
const sections={};
for(let i=0;i<headings.length;i++){const h=`## ${headings[i]}`;const start=text.indexOf(h);if(start<0){failures.push(`missing ${h}`);continue;}const bodyStart=start+h.length;let end=text.length;for(let j=i+1;j<headings.length;j++){const n=text.indexOf(`## ${headings[j]}`,bodyStart);if(n>=0){end=n;break;}}sections[headings[i]]=text.slice(bodyStart,end).trim();}
for(const h of headings.slice(0,-1))if((sections[h]||"").length<40)failures.push(`${h} lacks substantive evidence`);
if(!/Branch:\s*`[^`]+`/.test(sections["Repository state"]||""))failures.push("Repository state missing Branch");
if(!/Tested code HEAD:\s*`[0-9a-f]{40}`/i.test(sections["Repository state"]||""))failures.push("Repository state missing 40-hex Tested code HEAD");
if(!/SHA-256/i.test(sections["Asset integrity"]||""))failures.push("Asset integrity missing SHA-256 evidence");
if(!/`[^`]+`\s*(?:->|→|:)\s*exit\s+0/i.test(sections["Commands and results"]||""))failures.push("Commands and results missing exact successful command evidence");
for(const token of ["keyboard","reduced motion","320"])if(!(sections.Accessibility||"").toLowerCase().includes(token.toLowerCase()))failures.push(`Accessibility missing ${token}`);
for(const token of ["LCP","CLS","INP"])if(!(sections.Performance||"").includes(token))failures.push(`Performance missing ${token}`);
for(const token of ["CSP","network"])if(!(sections["Privacy and security"]||"").toLowerCase().includes(token.toLowerCase()))failures.push(`Privacy and security missing ${token}`);
for(const token of ["offline","video"])if(!(sections["Offline and failure paths"]||"").toLowerCase().includes(token))failures.push(`Offline and failure paths missing ${token}`);
if(!/(git revert|rollback)/i.test(sections.Rollback||""))failures.push("Rollback missing executable rollback method");
const verdict=(sections["Final verdict"]||"").split(/\r?\n/)[0].trim();
const allowed=["PASS","PASS WITH EXTERNAL LAUNCH GATES","BLOCKED"];
if(!allowed.includes(verdict))failures.push(`invalid verdict ${verdict||"missing"}`);
if(verdict==="BLOCKED")failures.push("verification verdict is BLOCKED");
if(failures.length){console.error("Verification report validation failed:\n"+failures.map(x=>`- ${x}`).join("\n"));process.exit(1);}
console.log(`Verification report PASS (${verdict}).`);
