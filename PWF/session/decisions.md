# Decision Log

## [2026-03-25] CI/CD Gap Remediation

**Decision**: Added standalone `security.yml` and specific validation jobs to `ci.yml`.

**Context**: LDR audit identified 5 gaps. Gaps 1, 3, 4, 5 were addressed via automation. Gap 2 (backend deployment) infra-dependent and manually excluded.

**Choice**: Use Node 22 and v4 actions.

**Reasoning**: Modernized stack per PRD/RNF requirements.
