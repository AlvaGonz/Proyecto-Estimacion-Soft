---
name: subagent-isolation
description: >
  Enforces clean context per subagent. Each agent gets ONE objective.
  Parallel investigation and exploration must be delegated to subagents,
  not polluting the main context window.
rules:
  - Main context = orchestration only. Never mix implementation + exploration in same context
  - One subagent = one goal (e.g., "Research MongoDB TTL indexes" OR "Fix JWT middleware", never both)
  - Subagent outputs must be structured: Findings / Recommendation / Files Affected
  - For complex problems, spawn minimum 2 subagents: one Researcher, one Implementer
  - After subagent completes, summarize result in ≤5 bullet points before continuing
  - Reference: https://github.com/ComposioHQ/agent-orchestrator
---
