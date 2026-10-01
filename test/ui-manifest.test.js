'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');

test('Cortex exposes a visible Activity Bar initializer',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const containers=pkg.contributes?.viewsContainers?.activitybar||[];
  const cortex=containers.find(x=>x.id==='cortex');
  assert.ok(cortex,'Cortex activity bar container missing');
  assert.equal(cortex.icon,'assets/cortex-activity.svg');
  assert.ok(fs.existsSync(path.join(root,cortex.icon)),'Cortex activity icon is not packaged in source');
  assert.ok((pkg.files||[]).includes('assets'),'assets folder is not included in the extension package');
  assert.ok((pkg.contributes?.views?.cortex||[]).some(x=>x.id==='cortex.projectView'),'Cortex project view missing');
  assert.ok((pkg.contributes?.viewsWelcome||[]).some(x=>x.view==='cortex.projectView'&&String(x.contents).includes('command:cortex.initializeWorkspace')),'Initialize Cortex button missing from project view');
  assert.ok((pkg.activationEvents||[]).includes('onView:cortex.projectView'),'Cortex project view does not activate the extension');
});
