---
description: Ensure systems output telemetry and track deployment procedures.
---

# observability-release

**Purpose:** Ensure systems output telemetry and track deployment procedures.
**When to Use:** In preparation for merging code and deploying to production.
**Inputs:** Completed feature code, CI/CD configs.
**Outputs:** Release checklists and post-release tracking logs.

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
- Deploying silently failing code without telemetry/logging.

## Expected Artifacts
- release-checklist.md
- post-release-review.md

*Must securely verify a proper release checklist and an exact post-release review.*

## Example Invocation
"Draft a release checklist and observability plan for v2."
