'use strict';
const fs=require('fs');
const path=require('path');
const {WORKSPACE_MARKER_REL,WORKSPACE_PLUGIN_REL}=require('./constants');
const {readJson,atomicWriteJson,ensureDir}=require('./fs-safe');
const {isolationStatus,enableWorkspace,workspaceStateDir}=require('./isolation');
const {loadSkillCatalog}=require('./skill-catalog');
const {ensureSkills}=require('./skill-installer');
const {createCheckpoint}=require('./memory');
const {generateResumeCapsule}=require('./resume');
const {runVerification}=require('./verification');
const {runSecurityAudit}=require('./security');
const {doctor}=require('./doctor');
const {setInspo}=require('./mcp');

function receiptPath(workspace){return path.join(workspaceStateDir(workspace).dir,'initialization.json');}
function readInitializationReceipt(workspace){
  const stateReceipt=readJson(receiptPath(workspace),null);
  if(stateReceipt)return stateReceipt;
  return isolationStatus(workspace).marker?.initialization||null;
}
function writeInitializationReceipt(workspace,receipt){
  const {dir}=workspaceStateDir(workspace);ensureDir(dir);
  const normalized={schema:1,...receipt,updatedAt:new Date().toISOString()};
  atomicWriteJson(receiptPath(workspace),normalized);
  const markerFile=path.join(workspace,WORKSPACE_MARKER_REL);
  const marker=readJson(markerFile,null);
  if(marker?.owner==='cortex'){
    marker.initialization=normalized;
    atomicWriteJson(markerFile,marker);
    atomicWriteJson(path.join(dir,'workspace.json'),marker);
  }
  return normalized;
}
function initializationStatus(workspace){
  const isolation=isolationStatus(workspace);
  const receipt=readInitializationReceipt(workspace);
  const pluginPresent=fs.existsSync(path.join(workspace,WORKSPACE_PLUGIN_REL,'plugin.json'));
  const initialized=Boolean(isolation.enabled&&pluginPresent&&receipt?.status==='complete');
  return{initialized,health:receipt?.health||null,receipt,pluginPresent,isolation};
}
function progress(onProgress,message,increment=0){try{onProgress?.({message,increment});}catch{}}

async function initializeProject({
  workspace,
  extensionRoot,
  extensionVersion='unknown',
  foreignPolicy='block',
  skillScope='ide-global',
  installSkills=true,
  verify=true,
  security=true,
  allowExternalSecurity=false,
  maxCheckpointHistory=200,
  force=false,
  onProgress
}){
  if(!workspace||!extensionRoot)throw new Error('workspace and extensionRoot are required');
  const before=initializationStatus(workspace);
  if(before.initialized&&!force)return{...before.receipt,alreadyInitialized:true,pluginPresent:true};

  progress(onProgress,'Checking workspace ownership…',3);
  const marker=enableWorkspace({workspace,extensionRoot,foreignPolicy});
  if(marker.mode==='observer'){
    const observerReceipt=writeInitializationReceipt(workspace,{status:'observer',health:'observer',mode:'observer',extensionVersion,startedAt:new Date().toISOString(),completedAt:new Date().toISOString(),reason:'foreign-orchestrator-present'});
    return{...observerReceipt,alreadyInitialized:false};
  }

  const startedAt=new Date().toISOString();
  writeInitializationReceipt(workspace,{status:'running',health:'initializing',mode:'primary',extensionVersion,startedAt});
  try{
    progress(onProgress,'Creating recovery baseline…',5);
    createCheckpoint(workspace,'initialization-start',{nextAction:'Finish Cortex project initialization.'},{maxHistory:maxCheckpointHistory});

    let skills=[];
    if(installSkills){
      const catalog=loadSkillCatalog(extensionRoot);
      const ids=(catalog.skills||[]).filter(x=>x.trusted===true).map(x=>x.id);
      progress(onProgress,`Installing ${ids.length} trusted skills…`,18);
      skills=await ensureSkills({extensionRoot,ids,scope:skillScope});
    }

    progress(onProgress,'Configuring Cortex MCP defaults…',8);
    const inspo=setInspo(workspace,false);

    let verification={status:'skipped',results:[]};
    if(verify){
      progress(onProgress,'Running deterministic project verification…',24);
      try{verification=await runVerification(workspace);}catch(e){verification={status:'error',error:e.message,results:[]};}
    }

    let securityReport={status:'skipped'};
    if(security){
      progress(onProgress,'Running safe security checks…',18);
      try{securityReport=await runSecurityAudit(workspace,{allowExternal:allowExternalSecurity});}catch(e){securityReport={status:'error',error:e.message};}
    }

    progress(onProgress,'Running Cortex Doctor…',12);
    const doctorReport=await doctor(workspace);
    const failedSkills=skills.filter(x=>x.status==='failed');
    const health=doctorReport.ready&&failedSkills.length===0&&!['fail','error'].includes(verification.status)&&!['fail','error'].includes(securityReport.status)?'ready':'needs-attention';
    const receipt=writeInitializationReceipt(workspace,{
      status:'complete',health,mode:'primary',extensionVersion,startedAt,completedAt:new Date().toISOString(),
      skills:{requested:skills.length,installed:skills.filter(x=>x.status==='installed').length,present:skills.filter(x=>x.status==='present').length,failed:failedSkills.map(x=>({id:x.id,error:x.error}))},
      verification:{status:verification.status},security:{status:securityReport.status},doctor:{ready:doctorReport.ready},mcp:{inspoDisabled:inspo.disabled===true}
    });
    progress(onProgress,'Saving final checkpoint and resume capsule…',12);
    createCheckpoint(workspace,'initialization-complete',{initializationHealth:health,verificationStatus:verification.status,securityStatus:securityReport.status,nextAction:health==='ready'?'Continue with the user task using the Cortex workflow.':'Review Cortex initialization warnings and retry missing setup.'},{maxHistory:maxCheckpointHistory});
    generateResumeCapsule(workspace);
    progress(onProgress,health==='ready'?'Cortex is ready.':'Cortex initialized with warnings.',100);
    return{...receipt,alreadyInitialized:false,skills,verification,securityReport,doctorReport};
  }catch(error){
    writeInitializationReceipt(workspace,{status:'failed',health:'needs-attention',mode:'primary',extensionVersion,startedAt,failedAt:new Date().toISOString(),error:error.message});
    throw error;
  }
}
module.exports={receiptPath,readInitializationReceipt,writeInitializationReceipt,initializationStatus,initializeProject};
