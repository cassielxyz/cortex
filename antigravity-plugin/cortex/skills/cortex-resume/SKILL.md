---
name: cortex-resume
description: Recover the exact project state after quota loss, restart, account switch, crash, or a short "continue" prompt without redoing verified work.
---

# Cortex Resume

When continuing:

1. Use the Cortex context injected before the model call.
2. Run `git status --short`, `git branch --show-current`, and inspect recent commits if the injected state is stale.
3. Inspect changed files before deciding they are incomplete.
4. Compare actual files with the previous plan/checkpoint.
5. Re-run the smallest verification needed to determine what is genuinely complete.
6. Continue from the first unfinished or unverified action.
7. Do not reset, overwrite, or recreate newer work to match an older checkpoint.
8. If another orchestrator now owns the workspace, remain passive.

A five-minute checkpoint is only a fallback. Repository changes after the checkpoint are expected and must be reconciled rather than discarded.
