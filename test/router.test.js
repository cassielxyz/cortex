'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {routeTask,rewriteSkillName,namespacedSkillName}=require('../src');

test('UI route selects design, browser and completion skills without unrelated external security tools',()=>{
  const r=routeTask('Build a responsive dashboard UI from a screenshot and verify interactions');
  assert.ok(r.externalSkills.includes('ui-ux-pro-max'));
  assert.ok(r.externalSkills.includes('taste'));
  assert.ok(r.externalSkills.includes('image-to-code'));
  assert.ok(r.externalSkills.includes('21st-ui-review'));
  assert.ok(r.bundledSkills.includes('cortex-playwright'));
  assert.ok(r.externalSkills.includes('superpowers-verification-before-completion'));
  assert.equal(r.requirements.browserEvidence,true);
});

test('cinematic product route selects renderer decision, GSAP and real Three.js product skills',()=>{
  const r=routeTask('Create a premium 2.5D/3D scroll website for a Yamaha R15 V3 bike using Three.js, GSAP and all color variants');
  assert.ok(r.reasons.includes('cinematic-web'));
  assert.ok(r.reasons.includes('real-product'));
  assert.ok(r.bundledSkills.includes('cortex-cinematic-web'));
  assert.ok(r.externalSkills.includes('scroll-world-storytelling'));
  assert.ok(r.externalSkills.includes('gsap-scrolltrigger'));
  assert.ok(r.externalSkills.includes('threejs-web'));
  assert.ok(r.externalSkills.includes('threejs-product-viewer'));
  assert.ok(r.externalSkills.includes('threejs-assets'));
  assert.equal(r.requirements.rendererDecision,true);
  assert.equal(r.requirements.subjectFidelity,true);
  assert.equal(r.requirements.visualEvidence,true);
  assert.equal(r.mode,'visual-architecture-build-verify');
});

test('R3F route selects the React Three Fiber and React-safe GSAP skills',()=>{
  const r=routeTask('Build an R3F product scene with @react-three/fiber and Drei');
  assert.ok(r.externalSkills.includes('threejs-r3f'));
  assert.ok(r.externalSkills.includes('gsap-react'));
});

test('ordinary backend work does not load cinematic skills',()=>{
  const r=routeTask('Implement a SQL migration and API repository method');
  assert.equal(r.externalSkills.includes('threejs-web'),false);
  assert.equal(r.bundledSkills.includes('cortex-cinematic-web'),false);
});

test('debug route selects systematic debugging',()=>{
  assert.ok(routeTask('Fix this crashing parser error').externalSkills.includes('superpowers-systematic-debugging'));
});

test('skill rewrite namespaces YAML name',()=>{
  const out=rewriteSkillName('---\nname: taste\ndescription: hello\n---\n# X\n',namespacedSkillName('taste'),'x');
  assert.match(out,/name: cortex-taste/);
  assert.match(out,/# X/);
});
