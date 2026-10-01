'use strict';

function list(value){return Array.isArray(value)?value:[];}
function text(value,fallback='-'){return value===undefined||value===null||value===''?fallback:String(value);}
function shortSha(value){const v=String(value||'');return v?v.slice(0,12):'none';}
function when(value){if(!value)return 'none';try{return new Date(value).toLocaleString();}catch{return String(value);}}
function changedLines(state,limit=20){return list(state?.current?.git?.changed).slice(0,limit).map(x=>`- \`${text(x.code,'??')}\` ${text(x.file,'unknown')}`);}

function buildStatusMarkdown({workspace,extensionVersion,initialization,resumeState}){
  const init=initialization||{};
  const receipt=init.receipt||{};
  const isolation=init.isolation||{};
  const state=resumeState||{};
  const git=state.current?.git||{};
  const checkpoint=state.checkpoint||{};
  const failed=list(receipt?.skills?.failed);
  const capabilities=list(receipt?.capabilities);
  const changed=changedLines(state);
  const status=init.initialized?'READY / INITIALIZED':'NOT INITIALIZED';
  const health=text(init.health,'unknown');
  const mode=text(isolation.marker?.mode||state.cortexMode,'disabled');
  const verification=text(state.verification?.status,'none');
  const security=text(state.security?.status,'none');
  const stale=state.reconciliation?.stale?'yes':'no';
  const reasons=list(state.reconciliation?.reasons).join(', ')||'none';
  return [
    '# Cortex Project Status','',
    `**State:** ${status}`,`**Health:** ${health}`,`**Mode:** ${mode}`,`**Cortex version:** ${text(extensionVersion,'unknown')}`,`**Workspace:** ${text(workspace||state.projectRoot,'unknown')}`,'',
    '## Recovery','',
    `- Last checkpoint: ${when(checkpoint.capturedAt)} (${text(checkpoint.reason,'none')})`,
    `- Checkpoint stale: ${stale}`,`- Reconciliation: ${reasons}`,`- Next action: **${text(state.nextAction,'Inspect current state and continue.')}**`,'',
    '## Git','',`- Branch: ${text(git.branch,'none')}`,`- HEAD: ${shortSha(git.head)}`,`- Changed entries: ${list(git.changed).length}`,'',
    ...(changed.length?['### Changed files','',...changed,'']:['### Changed files','','_Working tree clean or Git is unavailable._','']),
    '## Verification','',`- Deterministic verification: **${verification}**`,`- Security: **${security}**`,'',
    '## Initialization','',`- Receipt status: ${text(receipt.status,'none')}`,`- Skills requested: ${text(receipt?.skills?.requested,0)}`,`- Skills installed this run: ${text(receipt?.skills?.installed,0)}`,`- Skills already present: ${text(receipt?.skills?.present,0)}`,`- Failed skills: ${failed.length}`,
    ...(failed.length?failed.map(x=>`  - ${text(x.id)} — ${text(x.error,'unknown error')}`):[]),'',
    '## Active capabilities','',...(capabilities.length?capabilities.map(x=>`- ${x}`):['_No capability list recorded yet._']),'','---','',
    '### What the three Cortex buttons do','',
    '- **Show Status** opens this live report.',
    '- **Save Checkpoint** records the current repository state and refreshes the recovery capsule.',
    '- **Resume Project** reconciles the checkpoint with the real repository, copies a continuation prompt, and helps you return to the Antigravity Agent.',''
  ].join('\n');
}

function buildContinuationPrompt(state){
  const s=state||{};
  const git=s.current?.git||{};
  const changed=list(git.changed).slice(0,12).map(x=>`${text(x.code,'??')} ${text(x.file,'unknown')}`);
  const reasons=list(s.reconciliation?.reasons).join(', ')||'none';
  const verification=text(s.verification?.status,'none');
  const security=text(s.security?.status,'none');
  const next=text(s.nextAction,'Inspect the repository and continue from the first unfinished task.');
  return [
    'Continue this project from the actual current repository state using Cortex.','',
    `Branch: ${text(git.branch,'none')}`,`HEAD: ${shortSha(git.head)}`,`Checkpoint reconciliation: ${s.reconciliation?.stale?'stale/recovered':'current'} (${reasons})`,
    `Verification: ${verification}; security: ${security}.`,
    changed.length?`Current changed files:\n${changed.join('\n')}`:'Current working tree: clean or Git unavailable.','',
    `Next action: ${next}`,'',
    'Before editing, inspect existing files/commits and do not repeat completed work. Restore only relevant context, follow Cortex task/skill routing, verify implementation with deterministic tools and browser evidence when relevant, then checkpoint the new state.'
  ].join('\n');
}

function checkpointMessage(checkpoint,state){
  const cp=checkpoint?.checkpoint||checkpoint||{};
  const git=state?.current?.git||cp.git||{};
  const changed=list(git.changed).length;
  return `Checkpoint saved • ${text(git.branch,'no branch')} • ${changed} changed entr${changed===1?'y':'ies'} • ${when(cp.capturedAt)}`;
}
function resumeMessage(state){
  const changed=list(state?.current?.git?.changed).length;
  const recovered=state?.reconciliation?.stale?'Recovered newer repository state.':'Checkpoint matches the current repository state.';
  return `${recovered} ${changed} changed entr${changed===1?'y':'ies'} detected. Next: ${text(state?.nextAction,'inspect current state and continue')}`;
}
module.exports={buildStatusMarkdown,buildContinuationPrompt,checkpointMessage,resumeMessage};
