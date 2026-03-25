---
name: plan-before-build
description: >
  Activates Plan Mode before any non-trivial task (3+ steps or architecture decisions).
  The agent MUST write an explicit plan, wait for approval, then execute.
  If the task deviates, stop and re-plan immediately.
triggers:
  - "implement"
  - "create"
  - "refactor"
  - "add feature"
rules:
  - Always decompose at 4 levels: Why (Logic) → Data Flow (Analytic) → Algorithm (Computational) → Steps (Procedural)
  - Write the plan as numbered steps BEFORE writing any code
  - Include affected files in the plan (e.g. "@server/src/routes/estimacion.ts")
  - End plan with: "Waiting for approval before executing."
  - Use English as the implementation language; Spanish for comments matching project convention
  - Reference: https://github.com/ComposioHQ/agent-orchestrator
---
