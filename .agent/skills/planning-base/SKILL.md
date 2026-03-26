---
description: Provide a structural foundation for persistent planning and file-based workflow patterns to overcome context limits.
---

# planning-base

**Purpose:** Provide a structural foundation for persistent planning and file-based workflow patterns to overcome context limits.
**When to Use:** At the start of any complex, multi-step project.
**Inputs:** User objective, initial constraints.
**Outputs:** Markdown planning files (task_plan, findings, progress).

## Hard Rules (Global)
- **Strict Grounding:** Prefer official docs, repository files, tool outputs, and MCP over model memory.
- **No Hallucinations:** Never invent facts when evidence is missing.
- **Persistent Workflow:** For complex tasks, create persistent markdown working files.
- **Transparency:** Always separate facts, assumptions, and open questions.
- **Source-Backed Decisions:** Reject any skill design decision that cannot be traced back to a grounding source.


## Hard Rules (Skill-Specific)
- Maintain strict alignment with the provided templates.
- Explicitly fail if input conditions are not met.

## Failure Conditions
- Failing to keep the task_plan updated or omitting error logs.

## Expected Artifacts
- task_plan.md, findings.md, progress.md

## Example Invocation
"Begin planning the new feature using the persistent file-based workflow."
