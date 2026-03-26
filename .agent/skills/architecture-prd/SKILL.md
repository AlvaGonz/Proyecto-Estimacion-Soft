---
description: Design software architecture grounded in constraints and system patterns before writing code.
---

# architecture-prd

**Purpose:** Design software architecture grounded in constraints and system patterns before writing code.
**When to Use:** When designing a new system module or translating an idea to technical specifications.
**Inputs:** High-level user request, business rules.
**Outputs:** PRD, Architectural Decision Records (ADRs), and detailed specifications.

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
- Leaping into implementation without establishing acceptance criteria.

## Expected Artifacts
- PRD.md, ADR.md, SPEC.md

## Example Invocation
"Create an architecture specification and ADRs for the new messaging service."
