---
name: task-scope-guard
description: >
  Enforces: Simplicity first, root cause analysis, minimum blast radius.
  Each task touches only what is strictly necessary. No collateral changes.
  Modular SKILL.md approach from kodustech/awesome-agent-skills.
rules:
  - Every task must have a defined scope: "Files I will touch: [list]"
  - If root cause analysis shows 3+ files need changes: escalate to human before proceeding
  - Never change files outside declared scope — if a side fix is needed, create a new task
  - Simplicity check: "Is the simplest possible solution already correct?"
  - After each task: run `git diff --stat` — if more than 5 files changed, review with human
  - Use @tasks/lessons.md to detect if this category of change has caused bugs before
  - Reference: https://github.com/kodustech/awesome-agent-skills
---
