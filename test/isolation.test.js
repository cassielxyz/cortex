'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const os=require('os');const path=require('path');
const core=require('../src');
function tmp(name='cortex-'){return fs.mkdtempSync(path.join(os.tmpdir(),name));}
function plugin(root,name){const d=path.join(root,'.agents','plugins',name);fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,'plugin.json'),JSON.stringify({name}));}

test('detects DockyardOS repository and blocks Cortex',()=>{
  const w=tmp();fs.writeFileSync(path.join(w,'package.json'),JSON.stringify({name:'dockyardos'}));
  assert.equal(core.detectDockyardRepository(w),true);
  assert.throws(()=>core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..')}),/disabled inside the DockyardOS repository/);
  fs.rmSync(w,{recursive:true,force:true});
});

test('foreign orchestrator blocks default enable',()=>{
  const w=tmp();plugin(w,'dockyardos');
  assert.deepEqual(core.foreignOrchestrators(w),['dockyardos']);
  assert.throws(()=>core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..')}),/already active/);
  fs.rmSync(w,{recursive:true,force:true});
});

test('observer policy never receives execution authority',()=>{
  const w=tmp();plugin(w,'dockyardos');
  const m=core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..'),foreignPolicy:'observer'});
  assert.equal(m.mode,'observer');assert.equal(core.canExecute(w).ok,false);assert.equal(core.canExecute(w).reason,'observer-mode');
  fs.rmSync(w,{recursive:true,force:true});
});

test('clean workspace gets isolated Cortex plugin and project id',()=>{
  const w=tmp();const m=core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..')});
  assert.equal(m.owner,'cortex');assert.equal(m.mode,'primary');assert.equal(m.projectId.length,24);
  assert.equal(fs.existsSync(path.join(w,'.agents','plugins','cortex','plugin.json')),true);
  assert.equal(fs.existsSync(path.join(w,'.agents','plugins','dockyardos')),false);
  assert.equal(core.canExecute(w).ok,true);
  fs.rmSync(w,{recursive:true,force:true});
});

test('re-enabling an existing workspace refreshes Cortex plugin without losing ownership',()=>{
  const w=tmp();
  try{
    const first=core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..')});
    assert.equal(first.owner,'cortex');
    fs.writeFileSync(path.join(w,'.agents','plugins','cortex','stale.tmp'),'old');
    const second=core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..')});
    assert.equal(second.owner,'cortex');
    assert.equal(core.canExecute(w).ok,true);
    assert.equal(fs.existsSync(path.join(w,'.agents','plugins','cortex','plugin.json')),true);
  }finally{fs.rmSync(w,{recursive:true,force:true});}
});

test('namespaced skills cannot overwrite foreign names',()=>{
  assert.equal(core.namespacedSkillName('UI UX Pro Max'),'cortex-ui-ux-pro-max');
  assert.equal(core.namespacedSkillName('dockyardos'),'cortex-dockyardos');
});
