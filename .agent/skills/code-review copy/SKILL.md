# code-review
## Description
Automated PR review workflow ensuring alignment with project architecture and security standards.

## Workflow
1. Analyze changed files for structural integrity and boundary violations.
2. Check for security vulnerabilities (auth gaps, RBAC enforcement, data sanitization).
3. Validate test coverage for new or modified logic.
4. Verify compliance with naming and coding standards defined in AGENTS.md.
5. Provide a summary of findings with blocking gaps and suggested improvements.

## Constraints
- Never approve a change that skips LOGAUDITORIA for state changes.
- Ensure all protected routes have JWT and RBAC checks.
- Enforce 3-tier boundary strictly.

## Resources
- AGENTS.md
- .agent/rules/architecture.md
- .agent/rules/security.md
