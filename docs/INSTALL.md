# Install Cortex

## 1. Install the extension

Download the latest verified VSIX:

https://github.com/cassielxyz/cortex/releases/latest/download/antigravity-cortex-latest.vsix

In Antigravity:

1. Open **Extensions**.
2. Choose **Install from VSIX…**.
3. Select `antigravity-cortex-latest.vsix`.
4. Reload Antigravity when prompted.
5. Open the project you want Cortex to manage.
6. Click the **Cortex brain icon** in the left Activity Bar.
7. In the Cortex Project panel, click **Initialize Cortex**.

Cortex also exposes the same action in the status bar when the status bar is visible, but the Activity Bar panel is the primary setup UI and remains available even when the status bar is hidden.

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

When setup succeeds, the Cortex panel changes to **Cortex Ready**.

If a skill download or project verification has a problem, the panel changes to **Repair Cortex**. Clicking it retries the missing setup without blindly rebuilding the entire project state.

## One-time project behavior

Cortex remembers initialization per project. Reopening the project does not reinstall skills or rebuild initialization from scratch. The extension verifies the receipt and workspace plugin before showing **Cortex Ready**.

If the workspace plugin is deleted or setup becomes unhealthy, Cortex detects that and offers initialization/repair again.

## DockyardOS users

Cortex refuses primary initialization inside DockyardOS. If another known orchestrator already owns a workspace, Cortex follows `cortex.foreignOrchestratorPolicy` (default: `block`).

## Advanced commands

Manual commands remain available for troubleshooting and power users, including **Save Checkpoint**, **Resume Project**, **Verify Workspace**, **Security Audit**, **Install Trusted Skills**, and **Doctor**. They are not required for normal initialization.

## If the Cortex icon is missing

First confirm you installed the latest release, then reload Antigravity. Cortex now contributes its own Activity Bar container and activates on startup and when the Cortex view is opened. Older v1.1.0 builds only exposed the initializer in the status bar, so upgrade before troubleshooting further.

## Build from source

```bash
git clone https://github.com/cassielxyz/cortex.git
cd cortex
npm test
npm run check
npm run package:vsix
```

Then install the generated VSIX, open the Cortex Activity Bar panel, and click **Initialize Cortex**.

## Uninstall

Uninstall **Cortex for Antigravity** from Extensions. Durable recovery history under `~/.antigravity-cortex/` is intentionally preserved so uninstalling cannot silently destroy project checkpoints.
