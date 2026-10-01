'use strict';
const fs=require('fs');const path=require('path');const {commandExists}=require('./process');const {isolationStatus}=require('./isolation');const {loadRegistry}=require('./skill-registry');
async function doctor(workspace){const tools={};for(const t of ['git','node','npm','agy','playwright-cli','agent-reach','gitleaks','osv-scanner','strix'])tools[t]=await commandExists(t);const iso=isolationStatus(workspace);const reg=loadRegistry();return{at:new Date().toISOString(),workspace,isolation:iso,tools,skills:Object.values(reg.skills||{}).filter(x=>fs.existsSync(path.join(x.installedPath||'','SKILL.md'))),ready:iso.enabled&&!iso.dockyardRepo&&tools.git.ok&&tools.node.ok};}
module.exports={doctor};
