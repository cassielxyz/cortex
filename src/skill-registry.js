'use strict';
const path=require('path');const fs=require('fs');const {STATE_HOME}=require('./constants');const {ensureDir,readJson,atomicWriteJson,sha256Directory}=require('./fs-safe');
function registryFile(){return path.join(STATE_HOME,'skills','registry.json');}
function loadRegistry(){return readJson(registryFile(),{schema:2,skills:{}});}
function saveRegistry(reg){ensureDir(path.dirname(registryFile()));atomicWriteJson(registryFile(),reg);return reg;}
function namespacedSkillName(name){return`cortex-${String(name).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'')}`;}
function registerSkill({id,source,commit=null,installedPath,scope,upstreamName=null,license=null}){if(!fs.existsSync(path.join(installedPath,'SKILL.md')))throw new Error('SKILL.md missing');const reg=loadRegistry();const key=namespacedSkillName(id);reg.skills[key]={key,id,source,commit,installedPath,scope,upstreamName,license,sha256:sha256Directory(installedPath),updatedAt:new Date().toISOString()};saveRegistry(reg);return reg.skills[key];}
module.exports={registryFile,loadRegistry,saveRegistry,namespacedSkillName,registerSkill};
