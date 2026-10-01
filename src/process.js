'use strict';
const childProcess=require('child_process');
function run(command,args=[],{cwd,env,timeoutMs=120000,maxOutput=1024*1024}={}){
  return new Promise(resolve=>{
    let stdout='',stderr='',finished=false;
    let child;
    try{child=childProcess.spawn(command,args,{cwd,env:{...process.env,...env},shell:false,windowsHide:true});}
    catch(e){return resolve({code:-1,stdout:'',stderr:e.message,error:e.message,timedOut:false});}
    const cap=(current,chunk)=>{current+=chunk.toString();return current.length>maxOutput?current.slice(-maxOutput):current;};
    child.stdout?.on('data',d=>stdout=cap(stdout,d)); child.stderr?.on('data',d=>stderr=cap(stderr,d));
    const timer=setTimeout(()=>{if(finished)return; try{child.kill('SIGTERM');}catch{} setTimeout(()=>{try{child.kill('SIGKILL');}catch{}},1500).unref();},timeoutMs);
    child.on('error',e=>{if(finished)return;finished=true;clearTimeout(timer);resolve({code:-1,stdout,stderr:stderr+e.message,error:e.message,timedOut:false});});
    child.on('close',(code,signal)=>{if(finished)return;finished=true;clearTimeout(timer);resolve({code:code??-1,stdout,stderr,error:null,timedOut:signal==='SIGTERM'||signal==='SIGKILL'});});
  });
}
async function commandExists(name){ const cmd=process.platform==='win32'?'where':'which'; const r=await run(cmd,[name],{timeoutMs:8000,maxOutput:8192}); return {ok:r.code===0,path:r.code===0?r.stdout.split(/\r?\n/)[0].trim():null}; }
module.exports={run,commandExists};
