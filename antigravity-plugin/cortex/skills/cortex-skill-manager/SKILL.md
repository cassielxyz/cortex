---
name: cortex-skill-manager
description: Install missing Cortex allow-listed skills safely and globally without running arbitrary third-party installer scripts.
---

# Cortex Skill Manager

Use this only when the routed task requires an allow-listed external skill that is not already present.

```bash
node .agents/plugins/cortex/scripts/skill-ensure.js <skill-id> [<skill-id> ...]
```

Default scope is the Antigravity IDE global skill directory. Use `--scope=both` only when the same skills are also needed by Antigravity CLI.

The installer must:

- accept only IDs from the bundled allow-list;
- clone/fetch the exact configured repository;
- reject symlinks and oversized payloads;
- copy only the configured skill directory/file;
- namespace the installed skill as `cortex-*`;
- record source repository and exact commit;
- never run `npm install`, `pip install`, shell installers or other upstream setup scripts.
