---
name: cortex-playwright
description: Inspect and verify web UI in a real browser with Playwright CLI or Antigravity browser tools after frontend changes.
---

# Cortex Playwright

Use after meaningful frontend changes when a runnable page exists.

1. Start the app using its normal development/preview command.
2. Prefer `playwright-cli` when installed; otherwise use Antigravity's browser tooling.
3. Open the exact changed route.
4. Exercise the main user path and important failure/empty states.
5. Inspect desktop and mobile-sized layouts.
6. Check console/network failures, broken images, overflow, focus order and obvious accessibility problems.
7. Capture screenshots only when they help compare or debug; do not generate noise.
8. Repair issues and repeat the affected checks.

If `playwright-cli` is unavailable, do not claim browser verification occurred. Record the check as unavailable or use an equivalent browser tool.
