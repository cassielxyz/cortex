# Install Cortex

## 1. Install the extension

Download the latest verified VSIX:

https://github.com/cassielxyz/cortex/releases/latest/download/antigravity-cortex-latest.vsix

In Antigravity:

1. Open **Extensions**.
2. Choose **Install from VSIX…**.
3. Select `antigravity-cortex-latest.vsix`.
4. Open the project you want Cortex to manage.
5. Click **Initialize Cortex** in the status bar.

No command sequence is required for normal setup.

## 2. What Initialize Cortex does

The one-click initializer runs once for an eligible project and automatically:

- checks DockyardOS/foreign-orchestrator isolation;
- installs or refreshes `.agents/plugins/cortex/`;
- adds Cortex private workspace paths to Git's local exclude file;
- installs all allow-listed trusted skills using static copies only;
- namespaces installed skills as `cortex-*`;
- configures safe MCP defaults (Inspo remains disabled until explicitly enabled);
- creates durable project identity and recovery state under `~/.antigravity-cortex/`;
- creates an initial checkpoint;
- runs deterministic project verification;
- runs built-in redacted secret/security checks;
- runs Cortex Doctor;
- writes an initialization receipt;
- creates the final checkpoint and resume capsule.

When setup succeeds, the status bar changes to **Cortex Ready**.

If a skill download or project verification has a problem, the status bar changes to **Repair Cortex**. Clicking it retries the missing setup without blindly rebuilding the entire project state.

## One-time project behavior

Cortex remembers initialization per project. Reopening the project does not reinstall skills or rebuild initialization from scratch. The extension verifies the receipt and workspace plugin before showing **Cortex Ready**.

If the workspace plugin is deleted or setup becomes unhealthy, Cortex detects that and offers initialization/repair again.

## DockyardOS users

Cortex refuses primary initialization inside DockyardOS. If another known orchestrator already owns a workspace, Cortex follows `cortex.foreignOrchestratorPolicy` (default: `block`).

## Advanced commands

Manual commands remain available for troubleshooting and power users, including **Save Checkpoint**, **Resume Project**, **Verify Workspace**, **Security Audit**, **Install Trusted Skills**, and **Doctor**. They are not required for normal initialization.

## Build from source

```bash
git clone https://github.com/cassielxyz/cortex.git
cd cortex
npm test
npm run check
npm run package:vsix
```

Then install the generated VSIX and click **Initialize Cortex**.

## Uninstall

Uninstall **Cortex for Antigravity** from Extensions. Durable recovery history under `~/.antigravity-cortex/` is intentionally preserved so uninstalling cannot silently destroy project checkpoints.
