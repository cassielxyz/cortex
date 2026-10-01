'use strict';

const ROUTES = [
  {
    id: 'research',
    match: /latest|current|documentation|docs\b|research|compare|unknown|web search|api change|compatib/i,
    external: ['agent-reach'],
    bundled: ['cortex-research']
  },
  {
    id: 'architecture',
    match: /architect|system design|roadmap|new feature|new project|plan\b|refactor|migration/i,
    external: ['superpowers-brainstorming', 'superpowers-writing-plans'],
    bundled: ['cortex-orchestrate']
  },
  {
    id: 'debug',
    match: /bug|debug|error|crash|failing|broken|exception|regression/i,
    external: ['superpowers-systematic-debugging'],
    bundled: ['cortex-verify']
  },
  {
    id: 'implementation',
    match: /implement|build|create|add feature|develop|code|refactor/i,
    external: ['superpowers-test-driven-development'],
    bundled: ['cortex-orchestrate']
  },
  {
    id: 'ui',
    match: /\bui\b|\bux\b|frontend|page|screen|layout|style|design system|landing page|dashboard|website|web site/i,
    external: ['ui-ux-pro-max', 'taste', 'web-design-guidelines', 'awesome-design', '21st-ui-review'],
    bundled: ['cortex-ui-quality', 'cortex-playwright']
  },
  {
    id: 'ui-explore',
    match: /redesign|creative direction|design direction|explore (?:ui|design)|visual concept|show me .* directions|variants|inspiration/i,
    external: ['21st-ui-explore'],
    bundled: ['cortex-ui-quality']
  },
  {
    id: 'visual-reference',
    match: /reference image|screenshot|inspiration|recreate|image[- ]?to[- ]?code|pixel[- ]?perfect|match .* reference|look like/i,
    external: ['image-to-code'],
    bundled: ['cortex-ui-quality']
  },
  {
    id: 'cinematic-web',
    match: /three(?:\.js|\s*js)|threeui|react three fiber|\br3f\b|\bdrei\b|\bwebgl\b|\bwebgpu\b|\b2\.5d\b|\b3d\b|scroll[- ]?(?:driven|linked|animation|scrub|story|world)|scrollytelling|cinematic (?:web|website|landing|scroll)|product story|camera journey|parallax depth|frame sequence|video scrub/i,
    external: [
      'scroll-world-storytelling',
      'gsap-core',
      'gsap-scrolltrigger',
      'threejs-web',
      'threejs-animation',
      'threejs-performance'
    ],
    bundled: ['cortex-cinematic-web', 'cortex-ui-quality', 'cortex-playwright']
  },
  {
    id: 'real-product',
    match: /(?:product|motorcycle|motorbike|bike|car|vehicle|watch|shoe|phone|laptop|camera|bottle|packaging|furniture|appliance).{0,80}(?:showcase|viewer|configurator|3d|2\.5d|colors?|colours?|variants?|website|landing|scroll)|(?:showcase|viewer|configurator|3d|2\.5d|colors?|colours?|variants?|website|landing|scroll).{0,80}(?:product|motorcycle|motorbike|bike|car|vehicle|watch|shoe|phone|laptop|camera|bottle|packaging|furniture|appliance)/i,
    external: ['threejs-product-viewer', 'threejs-assets'],
    bundled: ['cortex-cinematic-web']
  },
  {
    id: 'r3f',
    match: /react three fiber|@react-three\/fiber|\br3f\b|\bdrei\b/i,
    external: ['threejs-r3f', 'gsap-react'],
    bundled: ['cortex-cinematic-web']
  },
  {
    id: 'browser',
    match: /browser|web app|responsive|interaction|e2e|playwright/i,
    external: [],
    bundled: ['cortex-playwright']
  },
  {
    id: 'security',
    match: /auth|security|release|payment|secret|permission|oauth|api key|vulnerability|owasp|strix/i,
    external: [],
    bundled: ['cortex-security-gate']
  },
  {
    id: 'token',
    match: /token|context window|concise|credit|quota|caveman/i,
    external: ['caveman'],
    bundled: ['cortex-orchestrate']
  }
];

function routeTask(text = '') {
  const task = String(text || '').trim();
  const external = new Set();
  const bundled = new Set(['cortex-resume', 'cortex-orchestrate']);
  const reasons = [];

  for (const route of ROUTES) {
    if (route.match.test(task)) {
      route.external.forEach((id) => external.add(id));
      route.bundled.forEach((id) => bundled.add(id));
      reasons.push(route.id);
    }
  }

  if (!reasons.length) reasons.push('general');

  const cinematic = reasons.includes('cinematic-web');
  const ui = reasons.includes('ui') || cinematic;
  const realProduct = reasons.includes('real-product');
  const referenceCritical = reasons.includes('visual-reference') || realProduct;

  if (cinematic) {
    external.add('scroll-world-storytelling');
    external.add('gsap-scrolltrigger');
    external.add('21st-ui-review');
    bundled.add('cortex-cinematic-web');
    bundled.add('cortex-playwright');
  }

  if (realProduct) {
    external.add('threejs-product-viewer');
    external.add('threejs-assets');
  }

  bundled.add('cortex-verify');
  bundled.add('cortex-security-gate');
  external.add('superpowers-verification-before-completion');

  const mode = cinematic
    ? 'visual-architecture-build-verify'
    : reasons.includes('debug')
      ? 'reproduce-diagnose-fix-verify'
      : ui
        ? 'design-build-browser-verify'
        : 'inspect-plan-implement-verify';

  return {
    task,
    reasons,
    bundledSkills: [...bundled],
    externalSkills: [...external],
    finalGate: ['cortex-verify', 'cortex-security-gate'],
    mode,
    requirements: {
      browserEvidence: ui,
      visualEvidence: ui,
      rendererDecision: cinematic,
      subjectFidelity: referenceCritical,
      realProduct,
      referenceCritical
    }
  };
}

function namespacedExternal(id) {
  return `cortex-${id}`;
}

function formatRouteInjection(route) {
  const r = route || routeTask('');
  const lines = [
    `CORTEX TASK ROUTE — ${r.mode}`,
    `User task: ${r.task || '(no task text recovered)'}`,
    `Detected: ${r.reasons.join(', ')}`,
    ''
  ];

  if (r.requirements.rendererDecision) {
    lines.push(
      'VISUAL ARCHITECTURE GATE:',
      'Before building, choose exactly one primary renderer:',
      '1) VIDEO SCRUB / FRAME SEQUENCE — best for cinematic realism and exact pre-rendered motion.',
      '2) LAYERED 2.5D — best when only authentic still images/cutouts are available.',
      '3) REAL-TIME THREE.JS / R3F — only when a real usable 3D model or genuinely spatial interaction exists.',
      'Do not fake a real product with primitive cubes/cylinders just to claim 3D.',
      'For exact products, a faithful 2.5D/video result is better than inaccurate geometry.',
      ''
    );
  }

  if (r.requirements.subjectFidelity) {
    lines.push(
      'SUBJECT FIDELITY GATE:',
      'Treat the requested real subject/product as reference-critical.',
      'Research/inspect authentic references and available assets before implementation.',
      'Do not invent product geometry, colorways, logos, specifications, or visual details.',
      'The subject must remain instantly recognizable; reject generic AI-looking substitutions.',
      ''
    );
  }

  lines.push(
    'SKILL ROUTING:',
    `Bundled: ${r.bundledSkills.join(', ')}`,
    `Trusted external candidates: ${r.externalSkills.map(namespacedExternal).join(', ')}`,
    'Load only the skills needed for the chosen renderer and current phase; do not dump every skill into context.',
    ''
  );

  if (r.requirements.rendererDecision) {
    lines.push(
      'CINEMATIC WEB ORDER:',
      '1. cortex-scroll-world-storytelling → choose video / 2.5D / real 3D.',
      '2. cortex-ui-ux-pro-max + cortex-taste → art direction and hierarchy.',
      '3. ThreeUI Community / 21st.dev references only when they materially improve the direction.',
      '4. cortex-gsap-scrolltrigger → one reversible scroll conductor/timeline.',
      '5. If real 3D was chosen: cortex-threejs-web + product/assets/animation skills; use cortex-threejs-r3f only for React/R3F.',
      '6. cortex-web-design-guidelines + cortex-21st-ui-review → review the DOM/UI layer.',
      '7. cortex-playwright → capture and inspect desktop/mobile visual evidence.',
      ''
    );
  }

  if (r.requirements.visualEvidence) {
    lines.push(
      'COMPLETION BAR:',
      'A successful build/lint is not visual verification.',
      'Open the real page, exercise scroll/interactions, capture screenshots at important chapters on desktop and mobile, inspect those screenshots, repair the largest visual gap, then repeat.',
      'Reject generic AI artifacts: oversized all-caps filler, random glass cards, arbitrary neon gradients, fake 3D primitives, excessive floating labels, and UI that covers the hero subject.',
      ''
    );
  }

  return lines.join('\n').trim();
}

module.exports = { ROUTES, routeTask, formatRouteInjection, namespacedExternal };
