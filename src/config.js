'use strict';
const path=require('path'); const {DEFAULTS,WORKSPACE_CONFIG_REL}=require('./constants'); const {readJson,atomicWriteJson,ensureDir}=require('./fs-safe');
function workspaceConfig(workspace,overrides={}){const local=readJson(path.join(workspace,WORKSPACE_CONFIG_REL),{})||{};return{...DEFAULTS,...local,...overrides};}
function writeWorkspaceConfig(workspace,patch){const file=path.join(workspace,WORKSPACE_CONFIG_REL);ensureDir(path.dirname(file));const current=readJson(file,{})||{};const next={...current,...patch};atomicWriteJson(file,next);return next;}
module.exports={workspaceConfig,writeWorkspaceConfig};
