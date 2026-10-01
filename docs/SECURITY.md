# Cortex Security

## Skill supply chain

Cortex uses a bundled allow-list. The installer:

- clones only configured HTTPS GitHub repositories;
- fetches a configured branch/ref;
- copies only the configured skill folder/file;
- rejects symbolic links;
- caps file count and total copied bytes;
- namespaces the skill name as `cortex-*`;
- stores repository, exact commit, license metadata and install timestamp;
- never runs upstream install scripts.

Review/updating the allow-list is a trust-sensitive code change.

## Built-in scanner

The deterministic security command searches Git tracked/untracked text files for a small set of high-confidence secret patterns. It records file and line with a redacted finding; it does not persist matched secret text.

## Optional tools

`gitleaks`, `osv-scanner` and `strix` are detected but not enabled automatically. External scanners require the Cortex setting `allowExternalSecurityTools`.

Strix additionally requires `.agents/cortex/security.json` to contain an explicit authorized configuration. Cortex does not auto-create authorization.

## MCP

The bundled Inspo MCP endpoint is disabled by default. Enabling it should be treated as allowing a remote design-research service to receive the queries sent to that MCP server. Do not send confidential content unnecessarily.
