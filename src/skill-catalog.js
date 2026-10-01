'use strict';
const fs=require('fs');const path=require('path');
function catalogPath(extensionRoot){return path.join(extensionRoot,'antigravity-plugin','cortex','catalog','skills.json');}
function loadSkillCatalog(extensionRoot){return JSON.parse(fs.readFileSync(catalogPath(extensionRoot),'utf8'));}
function catalogEntry(extensionRoot,id){const c=loadSkillCatalog(extensionRoot);const e=c.skills.find(x=>x.id===id);if(!e)throw new Error(`Unknown trusted skill: ${id}`);return e;}
module.exports={catalogPath,loadSkillCatalog,catalogEntry};
