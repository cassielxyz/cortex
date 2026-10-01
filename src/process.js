'use strict';
const childProcess=require('child_process');
const path=require('path');

const WINDOWS_SHELL_SHIMS=new Set(['npm','npx','pnpm','pnpx','yarn','yarnpkg','corepack']);

function needsWindowsShell(command){
  if(process.platform!=='win32')return false;
  const base=path.basename(String(command||'')).toLowerCase();
  return WINDOWS_SHELL_SHIMS.has(base)||WINDOWS_SHELL_SHIMS.has(base.replace(/\.cmd$/,''));
}

function run(command,args=[],{cwd,env,timeoutMs=120000,maxOutput=1024*1024}={}){
  return new Promise(resolve=>{
    let stdout='',stderr='',finished=false;
    let child;
    try{
      child=childProcess.spawn(command,args,{
        cwd,
        env:{...process.env,...env},
        shell:needsWindowsShell(command),
        windowsHide:true
      });
    }catch(e){return resolve({code:-1,stdout:'',stderr:e.message,error:e.message,timedOut:false});}
    const cap=(current,chunk)=>{current+=chunk.toString();return current.length>maxOutput?current.slice(-maxOutput):current;};
    child.stdout?.on('data',d=>stdout=cap(stdout,d)); child.stderr?.on('data',d=>stderr=cap(stderr,d));
    const timer=setTimeout(()=>{if(finished)return; try{child.kill('SIGTERM');}catch{} setTimeout(()=>{try{child.kill('SIGKILL');}catch{}},1500).unref();},timeoutMs);
    child.on('error',e=>{if(finished)return;finished=true;clearTimeout(timer);resolve({code:-1,stdout,stderr:stderr+e.message,error:e.message,timedOut:false});});
    child.on('close',(code,signal)=>{if(finished)return;finished=true;clearTimeout(timer);resolve({code:code??-1,stdout,stderr,error:null,timedOut:signal==='SIGTERM'||signal==='SIGKILL'});});
  });
}

async function commandExists(name){
  const cmd=process.platform==='win32'?'where':'which';
  const candidates=process.platform==='win32'&&WINDOWS_SHELL_SHIMS.has(String(name).toLowerCase())?[name,`${name}.cmd`]:[name];
  for(const candidate of candidates){
    const r=await run(cmd,[candidate],{timeoutMs:8000,maxOutput:8192});
    if(r.code===0)return{ok:true,path:r.stdout.split(/\r?\n/)[0].trim()};
  }
  return{ok:false,path:null};
}

module.exports={run,commandExists,needsWindowsShell};
