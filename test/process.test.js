'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const processModule=require('../src/process');

test('Windows shell shim detection is limited to package-manager command shims',()=>{
  const original=process.platform;
  // The helper is platform-gated, so on non-Windows hosts it must remain false.
  if(original!=='win32'){
    assert.equal(processModule.needsWindowsShell('npm'),false);
    assert.equal(processModule.needsWindowsShell('git'),false);
    return;
  }
  assert.equal(processModule.needsWindowsShell('npm'),true);
  assert.equal(processModule.needsWindowsShell('npm.cmd'),true);
  assert.equal(processModule.needsWindowsShell('pnpm'),true);
  assert.equal(processModule.needsWindowsShell('git'),false);
  assert.equal(processModule.needsWindowsShell('node'),false);
});
