---
description: Conduct deep investigations without hallucinating, mapping sources to conclusions.
---

# research-grounded

**Purpose:** Conduct deep investigations without hallucinating, mapping sources to conclusions.
**When to Use:** When investigating new tools, APIs, or debugging unknown errors.
**Inputs:** Research topic, relevant MCP parameters or URL targets.
**Outputs:** A verified source map and a chronological decision log.

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
- Making technical claims without citing the exact tool output or official docs.

## Expected Artifacts
- source_map.md, decision_log.md

## Example Invocation
"Research the implications of migrating to React 19."
