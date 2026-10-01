'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const os=require('os');const path=require('path');const cp=require('child_process');const core=require('../src');
function git(cwd,...args){cp.execFileSync('git',args,{cwd,stdio:'ignore'});}
test('secret scanner reports strong token patterns without returning token contents',()=>{const w=fs.mkdtempSync(path.join(os.tmpdir(),'cortex-sec-'));git(w,'init');fs.writeFileSync(path.join(w,'config.txt'),`token=ghp_${'A'.repeat(36)}\n`);const f=core.scanSecrets(w);assert.equal(f.length,1);assert.equal(f[0].id,'github-token');assert.equal(f[0].redacted,true);assert.equal(JSON.stringify(f).includes('ghp_'),false);fs.rmSync(w,{recursive:true,force:true});});
