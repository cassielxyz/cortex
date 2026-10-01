# Cortex Architecture

## Layers

1. **Editor extension** — workspace enable/disable, timers, editor-change checkpoints, routing, skill installation, doctor, deterministic verification and security report commands.
2. **Workspace Antigravity plugin** — rules, skills, subagents, hooks and optional MCP declarations.
3. **External state spine** — `~/.antigravity-cortex/projects/<id>/` for checkpoints, events, verification/security reports and resume capsules.
4. **Trusted skill cache** — `~/.antigravity-cortex/cache/repos/` plus namespaced global Antigravity skills.

## Project identity

A stable project ID is SHA-256 over the canonical Git root and sanitized origin remote. Only the first 24 hex characters are used for the directory name. Credentials/query strings are removed from remote URLs before persistence.

## Hook lifecycle

### PreInvocation

Injects a compact ephemeral recovery message containing current Git state, checkpoint freshness, verification state and the next recovery action. It does not replay the full session transcript.

### PostToolUse

Records relevant file/command events, errors and recognized verification commands. Event checkpoints are coalesced to avoid excessive disk writes.

### Stop

Always creates a stop checkpoint. On a normal model stop, if code/config changes still need verification, Cortex issues one continuation nudge for that exact repository fingerprint. Quota/error/max-step stops are allowed to terminate so recovery can happen next session.

## Context strategy

- hot: active task, errors, blockers, changed files;
- warm: requirements, decisions, architecture, latest verification;
- cold: resolved history and old sessions.

Cortex injects compact state rather than giant permanent prompts.
