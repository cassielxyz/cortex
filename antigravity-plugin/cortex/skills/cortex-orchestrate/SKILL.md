---
name: cortex-orchestrate
description: Primary Cortex engineering workflow. Use for non-trivial implementation, architecture, debugging, refactors, continuation, or multi-step project work.
---

# Cortex Orchestrate

Use the smallest process that still produces evidence.

## Start

1. Read the injected Cortex context before exploring.
2. Inspect current Git state and existing implementation before writing.
3. If this is a continuation, do not repeat work simply because the chat forgot it.
4. Classify the task: tiny change, bug, feature, UI, architecture, release, or research-heavy.
5. Load only the skills needed for that class.

If an allow-listed skill is missing, use the static installer:

```bash
node .agents/plugins/cortex/scripts/skill-ensure.js <skill-id>
```

Do not execute upstream repository install scripts as part of skill discovery.

## Workflow

### Tiny change
`inspect -> edit -> focused verification -> checkpoint`

### Bug
`reproduce -> root cause -> repair -> regression verification -> checkpoint`

### Feature
`requirements -> existing architecture -> plan -> implementation -> tests -> runtime verification -> security relevance -> checkpoint`

### UI
`requirements -> existing design system -> references if useful -> implement -> browser inspect -> accessibility/responsive pass -> checkpoint`

### Release
`full deterministic verification -> runtime/browser evidence -> security gate -> release readiness -> checkpoint`

## Decision rules

- Prefer repository truth over remembered text.
- Prefer deterministic tools over model confidence.
- Do not refactor unrelated code while fixing a focused issue.
- Record a blocker instead of inventing a success.
- Ask the user only when a missing choice materially changes product behavior or permissions; otherwise make a conservative reversible choice and document it.
- Treat external research as evidence, not as permission to overwrite local requirements.

## Completion vocabulary

Use only these meanings:

- **implemented**: code/files exist.
- **verified**: relevant deterministic checks/runtime evidence passed.
- **partially verified**: some required checks could not run.
- **blocked**: a concrete external dependency/permission prevents progress.
- **not implemented**: still absent.
