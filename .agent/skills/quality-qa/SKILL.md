---
description: Enforce rigorous quality assurance via matrix testing and smoke checklists.
---

# quality-qa

**Purpose:** Enforce rigorous quality assurance via matrix testing and smoke checklists.
**When to Use:** Before and after every implementation milestone to verify correctness.
**Inputs:** Feature code, PRD.
**Outputs:** Test execution matrices and verified smoke checklists.

## Hard Rules (Global)
- **Strict Grounding:** Prefer official docs, repository files, tool outputs, and MCP over model memory.
- **No Hallucinations:** Never invent facts when evidence is missing.
- **Persistent Workflow:** For complex tasks, create persistent markdown working files.
- **Transparency:** Always separate facts, assumptions, and open questions.
- **Source-Backed Decisions:** Reject any skill design decision that cannot be traced back to a grounding source.

- **Branching Required:** Every new implementation feature must start on a new git branch.
- **Checkpoints:** Every implementation-oriented skill must include explicit checkpoints and acceptance criteria before moving forward.

## Hard Rules (Skill-Specific)
- Maintain strict alignment with the provided templates.
- Explicitly fail if input conditions are not met.

## Failure Conditions
- Assuming tests pass without verifying tool execution outputs.

## Expected Artifacts
- test-matrix.md, smoke-checklist.md

## Checkpoints & Acceptance Criteria
- [ ] Branch created.
- [ ] Unit tests pass.
- [ ] Linting and build succeed.

## Example Invocation
"Run a QA pass on the newly implemented authentication flow."
