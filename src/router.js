'use strict';
const ROUTES=[
 {id:'research',match:/latest|current|documentation|docs\b|research|compare|unknown|web search|api change|compatib/i,external:['agent-reach'],bundled:['cortex-research']},
 {id:'architecture',match:/architect|system design|roadmap|new feature|new project|plan\b|refactor|migration/i,external:['superpowers-brainstorming','superpowers-writing-plans'],bundled:['cortex-orchestrate']},
 {id:'debug',match:/bug|debug|error|crash|failing|broken|exception|regression/i,external:['superpowers-systematic-debugging'],bundled:['cortex-verify']},
 {id:'implementation',match:/implement|build|create|add feature|develop|code|refactor/i,external:['superpowers-test-driven-development'],bundled:['cortex-orchestrate']},
 {id:'ui',match:/\bui\b|\bux\b|frontend|page|screen|layout|style|design system|landing page|dashboard/i,external:['ui-ux-pro-max','taste','web-design-guidelines','awesome-design'],bundled:['cortex-ui-quality','cortex-playwright']},
 {id:'visual-reference',match:/reference image|screenshot|inspiration|recreate|image[- ]?to[- ]?code|pixel[- ]?perfect/i,external:['image-to-code'],bundled:['cortex-ui-quality']},
 {id:'browser',match:/browser|web app|responsive|interaction|e2e|playwright/i,external:[],bundled:['cortex-playwright']},
 {id:'security',match:/auth|security|release|payment|secret|permission|oauth|api key|vulnerability|owasp|strix/i,external:[],bundled:['cortex-security-gate']},
 {id:'token',match:/token|context window|concise|credit|quota|caveman/i,external:['caveman'],bundled:['cortex-orchestrate']}
];
function routeTask(text=''){const external=new Set(),bundled=new Set(['cortex-resume','cortex-orchestrate']),reasons=[];for(const r of ROUTES){if(r.match.test(text)){r.external.forEach(x=>external.add(x));r.bundled.forEach(x=>bundled.add(x));reasons.push(r.id);}}if(!reasons.length)reasons.push('general');bundled.add('cortex-verify');bundled.add('cortex-security-gate');external.add('superpowers-verification-before-completion');return{task:String(text),reasons,bundledSkills:[...bundled],externalSkills:[...external],finalGate:['cortex-verify','cortex-security-gate'],mode:reasons.includes('ui')?'design-build-verify':reasons.includes('debug')?'reproduce-diagnose-fix-verify':'inspect-plan-implement-verify'};}
module.exports={ROUTES,routeTask};
