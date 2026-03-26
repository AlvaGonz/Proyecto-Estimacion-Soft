---
description: Apply systemic security validations and adversarial review models.
---

# security-guardrails

**Purpose:** Apply systemic security validations and adversarial review models.
**When to Use:** During architectural design, or when refactoring sensitive systems.
**Inputs:** Architecture specs, implementation code.
**Outputs:** Threat modeling reviews and security checklists.

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
- Writing secrets into code or skipping input sanitization.

## Expected Artifacts
- threat-review.md, validation-checklist.md

## Example Invocation
"Conduct a security and threat review on the query models."
