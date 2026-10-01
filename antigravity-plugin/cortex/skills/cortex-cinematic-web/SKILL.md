---
name: cortex-cinematic-web
description: Plan and build cinematic product websites, 2.5D experiences, video-scrub stories, and real-time Three.js/R3F scroll worlds with a renderer-first workflow, real-subject fidelity, GSAP choreography, and visual evidence before completion.
---

# Cortex Cinematic Web

Use this skill when the user asks for 2.5D/3D websites, Three.js, R3F, WebGL, cinematic product stories, scroll-driven animation, parallax depth, frame-sequence/video scrubbing, or immersive landing pages.

The goal is not "add 3D-looking decoration." The goal is to choose the correct visual architecture and make the requested subject carry the experience.

## 1. Choose one primary renderer before coding

Pick exactly one primary mode first.

### Mode A — Video scrub / frame sequence

Choose this when:
- photographic or cinematic realism matters more than live spatial interaction;
- a reliable product video, render, 360 sequence, or generated camera move is available;
- the desired experience looks like a smooth film controlled by scroll.

Preferred implementation:
- one continuous 6–15 second clip or an authored image sequence;
- a pinned/sticky stage;
- one normalized scroll progress value;
- map progress to video `currentTime` or frame index;
- use GSAP ScrollTrigger only as the scroll conductor, not as dozens of unrelated triggers;
- use a poster frame and reduced-motion fallback.

For responsive seeking, encode video with frequent keyframes or use an image sequence when the asset budget permits.

If a generative image-to-video tool is used for a real product, verify identity on multiple frames. Generative motion may alter fairings, logos, wheels, text, color blocking, or proportions. Do not use identity-drifting output as the final source.

### Mode B — Layered 2.5D

Choose this when:
- accurate still images/cutouts exist but no trustworthy 3D model exists;
- the user wants depth, camera-like motion, parallax, section transitions, and cinematic staging;
- fidelity matters more than free orbit.

Build from authentic subject layers:
- transparent foreground product cutout;
- background/environment plate;
- optional wheel, light, shadow, fog, highlight, decal, and foreground layers;
- CSS/DOM or WebGL planes with controlled z-depth;
- perspective transforms and subtle scale/rotation;
- GSAP master timeline tied to scroll.

Do not make a single full-bike PNG sit behind cards and call it 2.5D. The subject must change composition, crop, scale, depth, lighting, and relationship to copy across authored beats.

### Mode C — Real-time Three.js / R3F

Choose this only when:
- a real usable GLB/GLTF/FBX or equivalent model exists, or the task is genuinely abstract/spatial;
- interactive material variants, hotspots, orbit/inspect, or dynamic camera movement justify WebGL;
- performance and fallback work are acceptable.

For a real product:
- inspect mesh/material names, units, UVs, variant structure, and model fidelity first;
- do not fabricate the requested object with primitive geometry;
- if the model is inaccurate, fall back to Mode A or B.

Use one persistent scene and renderer. Scroll should move the camera/world state through authored compositions rather than mounting a new scene for each section.

## 2. Real-product fidelity gate

If the subject is a real product, vehicle, device, shoe, watch, packaging, or recognizable branded object:

1. Research/inspect authentic visual references and user-provided assets.
2. Establish a subject ledger:
   - silhouette/proportions;
   - distinctive front/side/rear details;
   - materials;
   - actual color variants;
   - logos/markings;
   - which details are uncertain.
3. Never invent a model, colorway, logo, technical spec, or component.
4. Prefer a faithful 2.5D/video implementation over fake real-time geometry.
5. Keep the product as the dominant visual subject. UI supports it; UI does not cover it.

A result fails if the requested product is not instantly recognizable at a glance.

## 3. Art direction before implementation

Use:
1. `cortex-ui-ux-pro-max` for information architecture and platform decisions.
2. `cortex-taste` for typography, composition, restraint, and anti-generic direction.
3. `cortex-21st-ui-explore` only when the direction is still open and multiple alternatives would help.
4. ThreeUI Community or threeui.com as a reference/component source when a relevant Three.js hero, shader, or effect exists.
5. `cortex-awesome-design` when a design-direction reference is useful.
6. `cortex-image-to-code` only when translating an approved screenshot/reference.

When using ThreeUI:
- prefer the free Community implementation/source when it fits;
- inspect the source rather than copying a screenshot blindly;
- adapt motion/material grammar to the current product;
- never make a page look like a component gallery;
- do not depend on Pro/Beta source the project cannot legally/accessibly use.

When using 21st.dev:
- use search/get/review for the DOM/UI layer and inspiration;
- do not let shadcn-style components dominate a cinematic product stage;
- hosted AI generation is optional and must not be assumed available.

## 4. Motion architecture

Use `cortex-gsap-core` and `cortex-gsap-scrolltrigger` for scroll choreography.

Preferred structure:

```text
native scroll
   ↓
one normalized progress value
   ↓
one master GSAP timeline / conductor
   ↓
scene or frame progress
   ↓
copy / lighting / camera / product state
```

Rules:
- prefer `scrub` for scroll-linked movement;
- use labels for authored chapters;
- pin the stage when the story needs a fixed viewport;
- make reverse scroll restore prior states exactly;
- avoid dozens of independent ScrollTriggers fighting each other;
- refresh after layout-changing async assets load;
- respect `prefers-reduced-motion`;
- animate transform/opacity whenever possible instead of layout properties.

## 5. Storyboard the page as scenes, not cards

Create 4–8 memorable beats. Each beat must change the product composition or visual state, not only the text.

For a motorcycle/product example:

```text
01 hero silhouette / reveal
02 front detail / headlight
03 fairing / surface / branding
04 cockpit or mechanical detail
05 engine / performance story
06 side profile / motion
07 color variants / material transition
08 final full-product payoff + CTA
```

The DOM copy should remain minimal and readable. Avoid dashboard navigation and card grids unless the product brief genuinely requires them.

## 6. Anti-AI-artifact rules

Reject these by default:
- random neon blue/purple gradients;
- huge all-caps headlines on every section;
- repetitive glass cards;
- floating pill labels everywhere;
- arbitrary grid floors and sci-fi lines;
- fake product geometry;
- decorative 3D shapes unrelated to the subject;
- excessive nav items;
- copy that invents product specs;
- the hero image merely sitting behind UI panels;
- identical section layouts with only text swapped.

Use one visual language, one motion grammar, and intentional negative space.

## 7. Three.js / R3F path

If Mode C is chosen:
- use `cortex-threejs-web` for the base architecture;
- use `cortex-threejs-product-viewer` for real product variants/configuration;
- use `cortex-threejs-assets` for GLTF/texture loading and compression;
- use `cortex-threejs-animation` for mixer/timeline behavior;
- use `cortex-threejs-performance` before finalizing;
- use `cortex-threejs-r3f` only when the project is actually React/R3F.

Do not load all of these if the selected mode is video or 2.5D.

## 8. Verification is visual, not only technical

After meaningful visual changes:

1. Run build/lint/tests.
2. Start the real page.
3. Use `cortex-playwright` or Antigravity browser tools.
4. Verify slow scroll, fast scroll, reverse scroll, reload at depth, and key interactions.
5. Capture representative screenshots at desktop and mobile widths.
6. Inspect each capture against the user request and authentic references.
7. Ask:
   - Is the subject instantly recognizable?
   - Is it dominant rather than hidden behind UI?
   - Does the selected renderer actually create depth/motion?
   - Are there generic AI artifacts?
   - Are color/product details accurate?
   - Does each chapter have a materially different composition?
8. Repair the largest gap and repeat.

Do not mark a cinematic visual task complete from a successful compile, a loaded page, or the mere presence of Three.js.
