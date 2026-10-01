'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function ensureDir(dir){ fs.mkdirSync(dir,{recursive:true}); return dir; }
function readJson(file,fallback=null){ try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return fallback;} }
function atomicWriteFile(file,content,mode=0o600){ ensureDir(path.dirname(file)); const tmp=`${file}.${process.pid}.${Date.now()}.tmp`; fs.writeFileSync(tmp,content,{mode}); fs.renameSync(tmp,file); }
function atomicWriteJson(file,value){ atomicWriteFile(file,`${JSON.stringify(value,null,2)}\n`); }
function isWithin(parent,target){ const rel=path.relative(path.resolve(parent),path.resolve(target)); return rel==='' || (!rel.startsWith('..')&&!path.isAbsolute(rel)); }
function copyDirSafe(src,dest,{maxFiles=500,maxBytes=20*1024*1024,ignore=new Set(['.git','node_modules','.venv','venv','dist','build'])}={}){
  let files=0,bytes=0; ensureDir(dest);
  function walk(s,d){ for(const e of fs.readdirSync(s,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){ if(ignore.has(e.name))continue; const sf=path.join(s,e.name),df=path.join(d,e.name); if(e.isSymbolicLink())throw new Error(`Symlink rejected: ${sf}`); if(e.isDirectory()){ensureDir(df);walk(sf,df);} else if(e.isFile()){ const st=fs.statSync(sf); files++; bytes+=st.size; if(files>maxFiles||bytes>maxBytes)throw new Error('Payload exceeds Cortex safety limits'); ensureDir(path.dirname(df)); fs.copyFileSync(sf,df); } } }
  walk(src,dest); return {files,bytes};
}
function sha256File(file){ return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function sha256Directory(dir){ const h=crypto.createHash('sha256'); function walk(cur,rel=''){ for(const e of fs.readdirSync(cur,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){ const f=path.join(cur,e.name),r=path.join(rel,e.name).replace(/\\/g,'/'); if(e.isSymbolicLink())throw new Error(`Symlink rejected: ${r}`); if(e.isDirectory())walk(f,r); else if(e.isFile()){h.update(r);h.update(fs.readFileSync(f));} } } walk(dir); return h.digest('hex'); }
function trimFiles(dir,maxCount){ let names=[]; try{names=fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort();}catch{return;} while(names.length>maxCount){const n=names.shift();try{fs.rmSync(path.join(dir,n),{force:true});}catch{}} }
module.exports={ensureDir,readJson,atomicWriteFile,atomicWriteJson,isWithin,copyDirSafe,sha256File,sha256Directory,trimFiles};
