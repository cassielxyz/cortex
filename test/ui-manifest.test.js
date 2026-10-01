'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');

test('Cortex exposes a visible Activity Bar initializer and stateful project view',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const containers=pkg.contributes?.viewsContainers?.activitybar||[];
  const cortex=containers.find(x=>x.id==='cortex');
  assert.ok(cortex,'Cortex activity bar container missing');
  assert.equal(cortex.icon,'assets/cortex-activity.svg');
  assert.ok(fs.existsSync(path.join(root,cortex.icon)),'Cortex activity icon is not packaged in source');
  assert.ok((pkg.files||[]).includes('assets'),'assets folder is not included in the extension package');
  assert.ok((pkg.contributes?.views?.cortex||[]).some(x=>x.id==='cortex.projectView'),'Cortex project view missing');
  assert.ok((pkg.activationEvents||[]).includes('onView:cortex.projectView'),'Cortex project view does not activate the extension');

  const ui=fs.readFileSync(path.join(root,'src','ui.js'),'utf8');
  assert.match(ui,/class CortexTreeProvider/,'Cortex project view must use a real stateful tree provider');
  assert.match(ui,/Cortex Ready/,'ready state is not rendered directly by the tree provider');
  assert.match(ui,/command:'cortex\.status'/,'Show Status action missing from stateful tree');
  assert.match(ui,/command:'cortex\.checkpoint'/,'Save Checkpoint action missing from stateful tree');
  assert.match(ui,/command:'cortex\.resume'/,'Resume Project action missing from stateful tree');
  assert.match(ui,/command:'cortex\.initializeWorkspace'/,'Initialize Cortex action missing from stateful tree');
});
