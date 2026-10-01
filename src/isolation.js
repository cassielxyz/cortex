'use strict';
const fs=require('fs'); const path=require('path'); const childProcess=require('child_process'); const {projectIdentity}=require('./project-id'); const {ensureDir,readJson,atomicWriteJson,copyDirSafe,isWithin}=require('./fs-safe');
const {STATE_HOME,WORKSPACE_PLUGIN_REL,WORKSPACE_MARKER_REL,KNOWN_FOREIGN_ORCHESTRATORS,RESERVED_FOREIGN_PATHS}=require('./constants');
function pluginNames(workspace){const root=path.join(workspace,'.agents','plugins');let entries=[];try{entries=fs.readdirSync(root,{withFileTypes:true});}catch{return [];}return entries.filter(e=>e.isDirectory()).map(e=>{const m=readJson(path.join(root,e.name,'plugin.json'),{});return String(m?.name||e.name).toLowerCase();});}
function detectDockyardRepository(workspace){const pkg=readJson(path.join(workspace,'package.json'),{});const repo=String(pkg?.repository?.url||'').toLowerCase();const name=String(pkg?.name||'').toLowerCase();if(name==='dockyardos'||repo.includes('/dockyardos'))return true;const p=path.join(workspace,'integrations','antigravity','plugin','plugin.json');return fs.existsSync(p)&&String(readJson(p,{})?.name||'').toLowerCase()==='dockyardos';}
function foreignOrchestrators(workspace){return pluginNames(workspace).filter(n=>KNOWN_FOREIGN_ORCHESTRATORS.has(n));}
function workspaceStateDir(workspace){const identity=projectIdentity(workspace);return{identity,dir:path.join(STATE_HOME,'projects',identity.id)};}
function isolationStatus(workspace){const {identity,dir}=workspaceStateDir(workspace);const marker=readJson(path.join(workspace,WORKSPACE_MARKER_REL),null);const foreign=foreignOrchestrators(workspace);const dockyardRepo=detectDockyardRepository(workspace);return{identity,stateDir:dir,enabled:marker?.owner==='cortex'&&marker?.projectId===identity.id,marker,foreign,dockyardRepo,blocked:dockyardRepo||foreign.length>0};}
function assertNoReservedTarget(target,workspace){const abs=path.resolve(target);for(const rel of RESERVED_FOREIGN_PATHS){const foreign=path.resolve(workspace,rel);if(abs===foreign||isWithin(foreign,abs))throw new Error(`Cortex isolation violation: reserved foreign path ${rel}`);}}

function ensureGitLocalExcludes(workspace){
  let exclude='';
  try{exclude=childProcess.execFileSync('git',['-C',workspace,'rev-parse','--git-path','info/exclude'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return{updated:false,reason:'not-git'};}
  if(!path.isAbsolute(exclude))exclude=path.resolve(workspace,exclude);
  ensureDir(path.dirname(exclude));
  let text='';try{text=fs.readFileSync(exclude,'utf8');}catch{}
  const entries=['/.agents/plugins/cortex/','/.agents/cortex/'];
  const missing=entries.filter(x=>!text.split(/\r?\n/).includes(x));
  if(!missing.length)return{updated:false,file:exclude};
  const prefix=text&& !text.endsWith('\n')?'\n':'';
  fs.appendFileSync(exclude,`${prefix}# Cortex local-only workspace files\n${missing.join('\n')}\n`);
  return{updated:true,file:exclude,added:missing};
}

function sleepSync(ms){
  try{Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);}catch{}
}
function retryFs(operation,{attempts=6,delayMs=80}={}){
  let last;
  for(let i=0;i<attempts;i++){
    try{return operation();}catch(error){
      last=error;
      if(!['EPERM','EBUSY','EACCES','ENOTEMPTY'].includes(error?.code)||i===attempts-1)throw error;
      sleepSync(delayMs*(i+1));
    }
  }
  throw last;
}
function copyPluginInPlace(src,dest){
  ensureDir(dest);
  copyDirSafe(src,dest,{maxFiles:1000,maxBytes:30*1024*1024});
  return dest;
}
function installWorkspacePlugin(extensionRoot,workspace){
  const src=path.join(extensionRoot,'antigravity-plugin','cortex');
  const dest=path.join(workspace,WORKSPACE_PLUGIN_REL);
  assertNoReservedTarget(dest,workspace);
  const tmp=`${dest}.tmp-${process.pid}-${Date.now()}`;
  const backup=`${dest}.bak-${process.pid}-${Date.now()}`;
  fs.rmSync(tmp,{recursive:true,force:true});
  copyDirSafe(src,tmp,{maxFiles:1000,maxBytes:30*1024*1024});
  ensureDir(path.dirname(dest));

  if(!fs.existsSync(dest)){
    retryFs(()=>fs.renameSync(tmp,dest));
    return dest;
  }

  try{
    retryFs(()=>fs.renameSync(dest,backup));
    try{
      retryFs(()=>fs.renameSync(tmp,dest));
    }catch(error){
      try{if(!fs.existsSync(dest)&&fs.existsSync(backup))retryFs(()=>fs.renameSync(backup,dest));}catch{}
      throw error;
    }
    try{retryFs(()=>fs.rmSync(backup,{recursive:true,force:true}));}catch{}
    return dest;
  }catch(error){
    if(!['EPERM','EBUSY','EACCES','ENOTEMPTY'].includes(error?.code))throw error;
    try{fs.rmSync(tmp,{recursive:true,force:true});}catch{}
    return copyPluginInPlace(src,dest);
  }
}
function enableWorkspace({workspace,extensionRoot,foreignPolicy='block'}){const status=isolationStatus(workspace);if(status.dockyardRepo)throw new Error('Cortex is disabled inside the DockyardOS repository. DockyardOS remains the sole orchestrator there.');if(status.foreign.length&&foreignPolicy==='block')throw new Error(`Another orchestrator is already active in this workspace: ${status.foreign.join(', ')}. Cortex stayed disabled.`);const pluginPath=installWorkspacePlugin(extensionRoot,workspace);const localExclude=ensureGitLocalExcludes(workspace);const {identity,dir}=workspaceStateDir(workspace);ensureDir(dir);const marker={schema:2,owner:'cortex',projectId:identity.id,projectRoot:identity.root,remote:identity.remote,mode:status.foreign.length?'observer':'primary',enabledAt:new Date().toISOString(),foreignOrchestrators:status.foreign,pluginPath,localExclude};atomicWriteJson(path.join(workspace,WORKSPACE_MARKER_REL),marker);atomicWriteJson(path.join(dir,'workspace.json'),marker);return marker;}
function disableWorkspace(workspace){fs.rmSync(path.join(workspace,WORKSPACE_PLUGIN_REL),{recursive:true,force:true});fs.rmSync(path.join(workspace,'.agents','cortex'),{recursive:true,force:true});return{disabled:true};}
function canExecute(workspace){const s=isolationStatus(workspace);if(!s.enabled)return{ok:false,reason:'not-enabled',status:s};if(s.dockyardRepo)return{ok:false,reason:'dockyard-repository',status:s};if(s.marker?.mode==='observer')return{ok:false,reason:'observer-mode',status:s};return{ok:true,reason:'primary',status:s};}
module.exports={pluginNames,detectDockyardRepository,foreignOrchestrators,workspaceStateDir,isolationStatus,assertNoReservedTarget,ensureGitLocalExcludes,installWorkspacePlugin,enableWorkspace,disableWorkspace,canExecute,retryFs};
