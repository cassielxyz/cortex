# Install Cortex

## Build and install the VSIX

Requirements: Node.js and Git.

```bash
git clone https://github.com/cassielxyz/cortex.git
cd cortex
npm test
npm run check
npm run package:vsix
```

The packaging command creates an installable Cortex `.vsix` locally.

1. Open Antigravity.
2. Open **Extensions**.
3. Choose **Install from VSIX…**.
4. Select the generated Cortex VSIX.
5. Open the project you want Cortex to manage.
6. Open the Command Palette.
7. Run **Cortex: Enable for Workspace**.
8. Run **Cortex: Doctor**.

The global extension stays passive until a workspace is explicitly enabled.

## What enabling a workspace changes

Cortex installs a workspace-scoped Antigravity plugin at:

```text
.agents/plugins/cortex/
```

It also creates a small workspace ownership marker under `.agents/cortex/`. Cortex places its private workspace paths in Git's local exclude file where possible, so the project repository does not need to commit Cortex runtime state.

Durable checkpoints and recovery state live outside the repository:

```text
~/.antigravity-cortex/projects/<project-id>/
```

## Skill setup

Cortex can install allow-listed skills only when the router needs them. Use:

```text
Cortex: Route Task & Ensure Skills
```

or:

```text
Cortex: Install Trusted Skills
```

The default IDE-global skill directory is:

```text
~/.gemini/config/skills/
```

Cortex uses `cortex-*` names so it does not overwrite skills owned by another orchestrator.

## DockyardOS users

No special uninstall is required. Cortex detects DockyardOS and refuses primary activation there by default. Do not change `cortex.foreignOrchestratorPolicy` from `block` unless you specifically want read-only observer behavior.

## Update

Pull the newer source, rebuild the VSIX, and install it over the existing Cortex extension. Re-run **Cortex: Doctor** after updating.

## Disable for one project

Run:

```text
Cortex: Disable for Workspace
```

This disables Cortex ownership for that workspace without touching another orchestrator.

## Uninstall

Use the Extensions panel to uninstall **Cortex for Antigravity**. Project checkpoint history under `~/.antigravity-cortex/` is intentionally not deleted automatically, so uninstalling the extension cannot silently destroy recovery history.
