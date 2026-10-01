'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const os=require('os');const path=require('path');const cp=require('child_process');
const state=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-init-state-'));process.env.CORTEX_STATE_HOME=state;process.env.CORTEX_IDE_SKILLS=path.join(state,'skills');
const core=require('../src');const extensionRoot=path.resolve(__dirname,'..');
function git(cwd,args){return cp.execFileSync('git',['-C',cwd,...args],{encoding:'utf8'});}
test('one-click initializer is idempotent and repairs a missing workspace plugin',async()=>{
 const w=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-init-work-'));git(w,['init']);git(w,['config','user.email','test@example.invalid']);git(w,['config','user.name','Cortex Test']);fs.writeFileSync(path.join(w,'README.md'),'init test\n');git(w,['add','.']);git(w,['commit','-m','init']);
 try{
  const first=await core.initializeProject({workspace:w,extensionRoot,extensionVersion:'1.1.0',installSkills:false,verify:false,security:false,maxCheckpointHistory:20});
  assert.equal(first.status,'complete');assert.equal(first.health,'ready');assert.equal(first.alreadyInitialized,false);assert.equal(core.initializationStatus(w).initialized,true);assert.ok(fs.existsSync(path.join(w,'.agents','plugins','cortex','plugin.json')));
  const second=await core.initializeProject({workspace:w,extensionRoot,extensionVersion:'1.1.0',installSkills:false,verify:false,security:false,maxCheckpointHistory:20});
  assert.equal(second.alreadyInitialized,true);
  fs.rmSync(path.join(w,'.agents','plugins','cortex'),{recursive:true,force:true});assert.equal(core.initializationStatus(w).initialized,false);
  const repaired=await core.initializeProject({workspace:w,extensionRoot,extensionVersion:'1.1.0',installSkills:false,verify:false,security:false,maxCheckpointHistory:20});
  assert.equal(repaired.status,'complete');assert.equal(core.initializationStatus(w).initialized,true);
 }finally{fs.rmSync(w,{recursive:true,force:true});}
});
