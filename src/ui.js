'use strict';
const vscode=require('vscode');

class CortexEmptyViewProvider{
  constructor(){
    this.emitter=new vscode.EventEmitter();
    this.onDidChangeTreeData=this.emitter.event;
  }
  getTreeItem(item){return item;}
  getChildren(){return [];}
  refresh(){this.emitter.fire(undefined);}
  dispose(){this.emitter.dispose();}
}

function registerCortexView(context){
  const provider=new CortexEmptyViewProvider();
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
    for(const [key,value] of Object.entries(values)){
      Promise.resolve(vscode.commands.executeCommand('setContext',key,value)).catch(()=>{});
    }
    provider.refresh();
  };

  return{update,refresh:()=>provider.refresh()};
}

module.exports={registerCortexView};
