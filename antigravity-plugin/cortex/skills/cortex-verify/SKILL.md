---
name: cortex-verify
description: Deterministically verify changes before completion using the project's real lint, typecheck, test, build and runtime commands.
---

# Cortex Verify

Never use "looks correct" as completion evidence.

1. Detect the project's existing verification commands from package scripts/build files/CI.
2. Prefer project-native commands over inventing new test infrastructure.
3. Start focused, then broaden when the change crosses boundaries.
4. Capture failures exactly enough to diagnose them; do not hide unavailable checks.
5. For UI work, verification is incomplete until actual browser/runtime behavior is inspected when a runnable app exists.
6. After a fix, re-run the failing check plus relevant regressions.
7. If a check cannot run because of missing credentials/services, report `partially verified`, not `verified`.

Common evidence includes lint/typecheck, unit/integration tests, build/package, runtime smoke checks, browser interaction, logs/console errors, and targeted security checks.
