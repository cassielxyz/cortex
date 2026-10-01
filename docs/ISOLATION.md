# Orchestrator Isolation

Cortex and DockyardOS may both be installed on one machine, but only one should own a workspace.

## Rules

- The Cortex extension is global/passive.
- Cortex activation is explicit per workspace.
- The Antigravity plugin is copied to `.agents/plugins/cortex/` only.
- DockyardOS repository detection hard-blocks Cortex primary activation.
- A discovered `dockyardos` or `gamefoundry` plugin blocks activation by default.
- Observer mode never receives execution/checkpoint authority.
- Third-party skills installed by Cortex are namespaced `cortex-*`.
- Cortex state is kept outside the repo and never reuses DockyardOS state directories.

The extension itself performs reserved-path checks before installing its plugin. Plugin rules also instruct the agent not to modify foreign orchestration state.
