'use strict';
const vscode=require('vscode');

class CortexTreeProvider{
  constructor(){
    this.emitter=new vscode.EventEmitter();
    this.onDidChangeTreeData=this.emitter.event;
    this.state={hasWorkspace:false,initialized:false,health:null,dockyardRepo:false,observer:false,blocked:false};
  }

  update(state={}){
    this.state={...this.state,...state};
    this.emitter.fire(undefined);
  }

  refresh(){this.emitter.fire(undefined);}
  dispose(){this.emitter.dispose();}

  item(label,{description='',tooltip='',command=null,icon=null,contextValue='cortex.info'}={}){
    const x=new vscode.TreeItem(label,vscode.TreeItemCollapsibleState.None);
    x.description=description;
    x.tooltip=tooltip||label;
    x.contextValue=contextValue;
    if(command)x.command={command,title:label};
    if(icon)x.iconPath=new vscode.ThemeIcon(icon);
    return x;
  }

  getTreeItem(item){return item;}

  getChildren(){
    const s=this.state;
    if(!s.hasWorkspace){
      return [
        this.item('Open a project folder',{description:'Cortex is waiting for a workspace',icon:'folder-opened',tooltip:'Open a project folder, then initialize Cortex.'})
      ];
    }

    if(s.dockyardRepo){
      return [
        this.item('DockyardOS workspace',{description:'Cortex stays disabled here',icon:'circle-slash',tooltip:'DockyardOS remains the sole orchestrator for this workspace.'}),
        this.item('Show Status',{command:'cortex.status',icon:'pulse',tooltip:'Open the current Cortex/DockyardOS ownership report.'})
      ];
    }

    if(s.observer){
      return [
        this.item('Cortex Observer',{description:'read-only mode',icon:'eye',tooltip:'Another orchestrator owns this workspace. Cortex will not execute or checkpoint.'}),
        this.item('Show Status',{command:'cortex.status',icon:'pulse',tooltip:'Open the live Cortex project status report.'})
      ];
    }

    if(s.blocked){
      return [
        this.item('Another orchestrator is active',{description:'Cortex stayed passive',icon:'warning',tooltip:'Cortex did not take ownership because another known orchestrator is active.'}),
        this.item('Show Status',{command:'cortex.status',icon:'pulse',tooltip:'Open the live Cortex project status report.'})
      ];
    }

    if(!s.initialized){
      return [
        this.item('Initialize / Upgrade Cortex',{description:'one-time project setup',icon:'rocket',tooltip:'Install/refresh trusted skills, workspace plugin, recovery state, verification and project memory.'}),
        this.item('Initialize Cortex',{command:'cortex.initializeWorkspace',icon:'play',tooltip:'Run the complete one-click Cortex initialization or upgrade.'})
      ];
    }

    if(s.health!=='ready'){
      return [
        this.item('Cortex needs attention',{description:String(s.health||'setup warning'),icon:'warning',tooltip:'Cortex is initialized but one or more checks need repair.'}),
        this.item('Repair Cortex',{command:'cortex.initializeWorkspace',icon:'tools',tooltip:'Retry only the missing or unhealthy Cortex setup steps.'}),
        this.item('Show Status',{command:'cortex.status',icon:'pulse',tooltip:'Open the live project/recovery/verification report.'})
      ];
    }

    return [
      this.item('Cortex Ready',{description:'project orchestration active',icon:'pass-filled',tooltip:'Cortex is initialized and healthy for this project.'}),
      this.item('Show Status',{description:'live health + recovery report',command:'cortex.status',icon:'pulse',tooltip:'Open a readable Cortex status report with health, Git, verification, security and next action.'}),
      this.item('Save Checkpoint',{description:'snapshot current repository state',command:'cortex.checkpoint',icon:'save',tooltip:'Capture branch, HEAD, changed files and recovery state now.'}),
      this.item('Resume Project',{description:'reconcile + prepare continuation',command:'cortex.resume',icon:'history',tooltip:'Compare the latest checkpoint with the real repository, generate the resume capsule and prepare a continuation prompt.'})
    ];
  }
}

function registerCortexView(context){
  const provider=new CortexTreeProvider();
  context.subscriptions.push(provider);
  context.subscriptions.push(vscode.window.registerTreeDataProvider('cortex.projectView',provider));

  const update=(state={})=>{
    const initialized=Boolean(state.initialized);
    const health=state.health||null;
    const observer=Boolean(state.observer);
    const blocked=Boolean(state.blocked)&&!observer;
    const ready=initialized&&health==='ready'&&!observer;
    const needsRepair=initialized&&health!=='ready'&&!observer;
    const values={
      'cortex.hasWorkspace':Boolean(state.hasWorkspace),
      'cortex.initialized':initialized,
      'cortex.ready':ready,
      'cortex.needsRepair':needsRepair,
      'cortex.blocked':blocked,
      'cortex.observer':observer
    };
    provider.update({...state,initialized,health,observer,blocked});
    for(const [key,value] of Object.entries(values)){
      Promise.resolve(vscode.commands.executeCommand('setContext',key,value)).catch(()=>{});
    }
  };

  return{update,refresh:()=>provider.refresh()};
}

module.exports={registerCortexView,CortexTreeProvider};
