'use strict';
const fs=require('fs'); const path=require('path'); const crypto=require('crypto'); const childProcess=require('child_process');
function canonicalPath(p){try{return fs.realpathSync(p);}catch{return path.resolve(p);}}
function gitValue(workspace,args){try{return childProcess.execFileSync('git',['-C',workspace,...args],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return '';}}
function sanitizeRemote(remote){ const raw=String(remote||'').trim(); if(!raw)return null; if(/^[^@\s]+@[^:]+:.+/.test(raw))return raw.replace(/^[^@]+@/,'git@'); try{const u=new URL(raw);u.username='';u.password='';u.search='';u.hash='';return u.toString().replace(/\/$/,'');}catch{return raw.replace(/https?:\/\/[^/@]+@/,'https://');}}
function projectIdentity(workspace){const initial=canonicalPath(workspace);const top=gitValue(initial,['rev-parse','--show-toplevel'])||initial;const root=canonicalPath(top);const remote=sanitizeRemote(gitValue(root,['config','--get','remote.origin.url']));const id=crypto.createHash('sha256').update(`${root}\n${remote||''}`).digest('hex').slice(0,24);return{id,root,remote};}
module.exports={canonicalPath,gitValue,sanitizeRemote,projectIdentity};
