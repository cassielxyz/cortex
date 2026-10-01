---
name: cortex-security-gate
description: Final secure-development and release gate using OWASP-oriented review, deterministic secret/dependency checks and optional authorized Strix testing.
---

# Cortex Security Gate

Apply security proportionally throughout development and run a final gate before a release-ready claim.

Review relevant boundaries for authentication, authorization, session/token handling, input validation, output encoding, SSRF/path traversal, file upload, secrets, dependency risk, data storage, logging/privacy, API abuse controls and platform permissions. Use the applicable OWASP guidance for web/API/mobile surfaces.

Use deterministic scanners when available. Missing optional scanners are `unavailable`, not `pass`.

Strix may run only when:

- the target is owned by the user or explicitly authorized;
- `.agents/cortex/security.json` has an explicit authorized Strix configuration;
- the requested test stays within that scope.

After security fixes, repeat the relevant checks. Do not mark release ready with unresolved high-impact findings.
