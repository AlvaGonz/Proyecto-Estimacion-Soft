---
description: Orchestrate actual coding steps according to plans, utilizing branch-based development.
---

# implementation-orchestrator

**Purpose:** Orchestrate actual coding steps according to plans, utilizing branch-based development.
**When to Use:** When transitioning from planning to writing/altering codebase files.
**Inputs:** task_plan.md, SPEC.md.
**Outputs:** Code commits on a new feature branch, updated rollout plan.

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
- Writing code on the main branch directly or ignoring checkpoints.

## Expected Artifacts
- agent_prompt.md, rollout_plan.md

## Checkpoints & Acceptance Criteria
- [ ] Branch created.
- [ ] Unit tests pass.
- [ ] Linting and build succeed.

## Example Invocation
"Execute phase 2 of the task plan."
