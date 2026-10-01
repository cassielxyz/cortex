'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const os=require('os');
const path=require('path');
const cp=require('child_process');
const core=require('../src');

function git(cwd,...args){cp.execFileSync('git',args,{cwd,stdio:'ignore'});}
function hook(workspace,mode,payload,stateHome){
  const file=path.join(workspace,'.agents','plugins','cortex','scripts','hook.js');
  const r=cp.spawnSync(process.execPath,[file,mode],{
    input:JSON.stringify(payload),
    encoding:'utf8',
    env:{...process.env,CORTEX_STATE_HOME:stateHome}
  });
  assert.equal(r.status,0,r.stderr);
  return JSON.parse(r.stdout.trim());
}

test('hook injects recovery context and nudges once for unverified code changes',()=>{
  const w=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-hook-'));
  const state=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-hook-state-'));
  git(w,'init');git(w,'config','user.email','cortex@example.invalid');git(w,'config','user.name','Cortex Test');
  fs.writeFileSync(path.join(w,'app.js'),'console.log(1)\n');
  git(w,'add','.');git(w,'commit','-m','init');
  core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..')});

  let out=hook(w,'pre-invocation',{workspacePaths:[w],invocationNum:0,modelName:'test'},state);
  assert.match(out.injectSteps[0].ephemeralMessage,/CORTEX ACTIVE/);

  fs.writeFileSync(path.join(w,'app.js'),'console.log(2)\n');
  out=hook(w,'post-tool',{workspacePaths:[w],toolCall:{name:'write_to_file',args:{TargetFile:path.join(w,'app.js')}},error:''},state);
  assert.deepEqual(out,{});

  out=hook(w,'stop',{workspacePaths:[w],terminationReason:'model_stop',fullyIdle:true,error:''},state);
  assert.equal(out.decision,'continue');
  const second=hook(w,'stop',{workspacePaths:[w],terminationReason:'model_stop',fullyIdle:true,error:''},state);
  assert.equal(second.decision,'stop');

  fs.rmSync(w,{recursive:true,force:true});fs.rmSync(state,{recursive:true,force:true});
});

test('pre-invocation auto-routes a cinematic real-product prompt from the Antigravity transcript and enforces visual evidence',()=>{
  const w=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-hook-visual-'));
  const state=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-hook-visual-state-'));
  git(w,'init');git(w,'config','user.email','cortex@example.invalid');git(w,'config','user.name','Cortex Test');
  fs.writeFileSync(path.join(w,'index.html'),'<main>old</main>\n');
  git(w,'add','.');git(w,'commit','-m','init');
  core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..')});

  const transcript=path.join(state,'transcript.jsonl');
  fs.writeFileSync(transcript,JSON.stringify({
    role:'user',
    content:'Create a 2.5D/3D cinematic scroll website for my Yamaha R15 V3 bike using Three.js and GSAP with all color variants'
  })+'\n');

  let out=hook(w,'pre-invocation',{
    workspacePaths:[w],
    transcriptPath:transcript,
    invocationNum:0,
    conversationId:'visual-test',
    modelName:'test'
  },state);
  const injected=out.injectSteps[0].ephemeralMessage;
  assert.match(injected,/CORTEX TASK ROUTE — visual-architecture-build-verify/);
  assert.match(injected,/VIDEO SCRUB \/ FRAME SEQUENCE/);
  assert.match(injected,/SUBJECT FIDELITY GATE/);
  assert.match(injected,/cortex-gsap-scrolltrigger/);
  assert.match(injected,/cortex-threejs-product-viewer/);

  fs.writeFileSync(path.join(w,'index.html'),'<main>new</main>\n');
  hook(w,'post-tool',{
    workspacePaths:[w],
    toolCall:{name:'write_to_file',args:{TargetFile:path.join(w,'index.html')}},
    error:''
  },state);

  hook(w,'post-tool',{
    workspacePaths:[w],
    toolCall:{name:'run_command',args:{CommandLine:'npm run build'}},
    error:''
  },state);

  out=hook(w,'stop',{workspacePaths:[w],terminationReason:'model_stop',fullyIdle:true,error:''},state);
  assert.equal(out.decision,'continue');
  assert.match(out.reason,/browser\/runtime evidence/i);

  hook(w,'post-tool',{
    workspacePaths:[w],
    toolCall:{name:'browser_navigate',args:{url:'http://localhost:5173'}},
    error:''
  },state);
  out=hook(w,'stop',{workspacePaths:[w],terminationReason:'model_stop',fullyIdle:true,error:''},state);
  assert.equal(out.decision,'continue');
  assert.match(out.reason,/screenshot\/visual evidence/i);

  hook(w,'post-tool',{
    workspacePaths:[w],
    toolCall:{name:'browser_take_screenshot',args:{}},
    error:''
  },state);
  out=hook(w,'stop',{workspacePaths:[w],terminationReason:'model_stop',fullyIdle:true,error:''},state);
  assert.equal(out.decision,'continue');
  assert.match(out.reason,/visual fidelity gate/i);

  const finalStop=hook(w,'stop',{workspacePaths:[w],terminationReason:'model_stop',fullyIdle:true,error:''},state);
  assert.equal(finalStop.decision,'stop');

  fs.rmSync(w,{recursive:true,force:true});fs.rmSync(state,{recursive:true,force:true});
});

test('hook stays passive in observer mode',()=>{
  const w=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-hook-obs-'));
  const state=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-hook-obs-state-'));
  git(w,'init');git(w,'config','user.email','cortex@example.invalid');git(w,'config','user.name','Cortex Test');
  fs.mkdirSync(path.join(w,'.agents','plugins','dockyardos'),{recursive:true});
  fs.writeFileSync(path.join(w,'.agents','plugins','dockyardos','plugin.json'),'{"name":"dockyardos"}');
  core.enableWorkspace({workspace:w,extensionRoot:path.resolve(__dirname,'..'),foreignPolicy:'observer'});
  const out=hook(w,'pre-invocation',{workspacePaths:[w]},state);
  assert.deepEqual(out,{});
  fs.rmSync(w,{recursive:true,force:true});fs.rmSync(state,{recursive:true,force:true});
});
