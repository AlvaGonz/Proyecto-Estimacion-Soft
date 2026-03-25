---
name: elegance-enforcer
description: >
  For every solution, pause and ask: "Is there a more elegant way?"
  Enforces minimal code that satisfies requirements only — no over-engineering.
  Implements TDD Red Phase principle: write only what the failing test demands.
rules:
  - If a solution exceeds 50 lines for a single function: stop and redesign
  - No TODO / "implement later" comments — either implement it or remove it
  - Question every abstraction: "Is this abstraction needed NOW or just speculative?"
  - Prefer native Node.js/React APIs over adding new dependencies
  - For simple fixes: no new files, no new patterns — minimal surgical change only
  - Run `npm run lint` after every change — zero warnings tolerated
  - TDD Reference: https://github.com/github/awesome-copilot (TDD Red Phase skill)
---
