---
description: Leverage MCP to bridge local context with external tools securely.
---

# mcp-integration

**Purpose:** Leverage MCP to bridge local context with external tools securely.
**When to Use:** When the project must communicate with MCP servers, databases, or external APIs.
**Inputs:** MCP server configurations, connection strings.
**Outputs:** MCP operational maps and execution policies.

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
- Exposing credentials or attempting to use disconnected tools.

## Expected Artifacts
- mcp-map.md, tool-policy.md

## Example Invocation
"Map our available MCP resources and generate a tool usage policy."
