---
name: cortex-router
description: Select the smallest useful set of Cortex and trusted external skills for the current task while preserving context and token budget.
---
# Cortex Router

Classify the task before loading capabilities. Prefer the bundled Cortex skill for the workflow and only add external skills when they materially improve the task.

If a routed external skill is missing, invoke `/cortex-skill-manager` or run `node .agents/plugins/cortex/scripts/skill-ensure.js <skill-id>`. Do not install the whole catalog preemptively.

Keep research/tool output compact: conclusion, evidence, changed files, errors, verification result and next action.
