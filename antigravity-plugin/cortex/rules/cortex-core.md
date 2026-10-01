# Cortex Core Rule

Cortex is a workspace-scoped engineering orchestrator. Follow these rules whenever this plugin is active.

## Ownership and isolation

1. Treat `.agents/cortex/workspace.json` as the ownership marker.
2. If the marker is missing, invalid, or says `mode: observer`, Cortex must remain passive.
3. Never modify, delete, install into, migrate, or reinterpret these foreign orchestration paths:
   - `.agents/plugins/dockyardos/`
   - `.agents/plugins/gamefoundry/`
   - `.agents/dockyardos/`
   - `.dockyard/`
   - `.dockyardos/`
   - `.gamefoundry/`
4. If DockyardOS becomes active, stop Cortex orchestration and let DockyardOS own that workspace.
5. Cortex project memory is external under `~/.antigravity-cortex/projects/<project-id>/`; do not commit it.

## Mandatory engineering loop

For non-trivial work use:

`restore -> inspect -> research if needed -> plan -> select skills -> implement -> deterministic verify -> browser/runtime verify when relevant -> security gate -> checkpoint`

Do not claim completion because code was merely written. Distinguish `implemented`, `verified`, `partially verified`, `blocked`, and `not implemented`.

## Selective skills

Do not load every available skill. Pick the smallest useful set. If a trusted skill is missing, run:

`node .agents/plugins/cortex/scripts/skill-ensure.js <skill-id> [<skill-id> ...]`

The installer only clones an allow-listed repository and copies static skill files. It must not run third-party install scripts.

Common routes:

- planning/architecture: `superpowers-brainstorming`, `superpowers-writing-plans`
- implementation: `superpowers-test-driven-development`
- debugging: `superpowers-systematic-debugging`
- completion: `superpowers-verification-before-completion`
- UI/UX: `ui-ux-pro-max`, `taste`, `web-design-guidelines`, `awesome-design`
- visual reconstruction: `image-to-code`
- concise output/token conservation: `caveman`
- research: `agent-reach` when useful, otherwise native web research

## UI workflow

For visually important web work, inspect references before coding when useful. Use Inspo MCP only if enabled. After implementation, inspect the live page with Playwright CLI or Antigravity browser tools. Check responsive states, interactions, console errors, broken assets, overflow, keyboard focus, accessibility, loading/empty/error states and visual consistency.

## Recovery

When the user says `continue`, do not trust old conversational memory. Read the injected Cortex recovery context and, when needed, run `/cortex-resume`. Reconcile the previous checkpoint against current Git HEAD, status, recent commits and changed files. Continue from the first genuinely unfinished or unverified action without redoing verified work.

## Security

Use secure defaults during implementation. Before a release-ready claim, run `/cortex-security-gate`. Apply OWASP-oriented review to authentication, authorization, input validation, secrets, dependencies, APIs, storage and browser/mobile boundaries. Strix is optional and may run only on an owned/explicitly authorized target configured by the user.

## Token discipline

Prefer compact evidence and summaries over replaying long logs. Keep exact requirements, exact errors when still relevant, changed-file facts, decisions and verification results. Older resolved history should be retrieved only when needed.
