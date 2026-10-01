'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const os=require('os');const path=require('path');const cp=require('child_process');const core=require('../src');
function git(cwd,...args){cp.execFileSync('git',args,{cwd,stdio:'ignore'});}
test('resume capsule trusts current repository over stale checkpoint',()=>{
  const w=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-resume-'));git(w,'init');git(w,'config','user.email','cortex@example.invalid');git(w,'config','user.name','Cortex Test');
  fs.writeFileSync(path.join(w,'file.txt'),'one\n');git(w,'add','.');git(w,'commit','-m','init');core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..')});core.createCheckpoint(w,'before-change');
  fs.writeFileSync(path.join(w,'file.txt'),'two\n');const capsule=core.generateResumeCapsule(w);
  assert.equal(capsule.state.reconciliation.stale,true);assert.match(capsule.markdown,/working-tree-changed/);assert.match(capsule.markdown,/file\.txt/);assert.ok(fs.existsSync(capsule.file));
  fs.rmSync(w,{recursive:true,force:true});
});
test('context governor prioritizes hot state',()=>{
  const r=core.compactContext([{kind:'history',text:'x'.repeat(100)},{kind:'active-task',text:'ACTIVE'},{kind:'decision',text:'DECISION'}],20);
  assert.equal(r.selected[0].text,'ACTIVE');assert.equal(r.selected[1].text,'DECISION');
});
