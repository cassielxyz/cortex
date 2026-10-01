'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const os=require('os');const path=require('path');const cp=require('child_process');const core=require('../src');
function run(cwd,...args){cp.execFileSync('git',args,{cwd,stdio:'ignore'});}
test('checkpoint reconciliation notices work after stale checkpoint',()=>{
 const w=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-memory-'));run(w,'init');run(w,'config','user.email','cortex@example.invalid');run(w,'config','user.name','Cortex Test');
 fs.writeFileSync(path.join(w,'a.txt'),'1\n');run(w,'add','.');run(w,'commit','-m','init');core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..')});
 const first=core.createCheckpoint(w,'test');assert.ok(first.checkpoint.git.head);
 fs.writeFileSync(path.join(w,'a.txt'),'2\n');const r=core.reconcile(w);assert.equal(r.stale,true);assert.ok(r.reasons.includes('working-tree-changed'));
 fs.rmSync(w,{recursive:true,force:true});
});
