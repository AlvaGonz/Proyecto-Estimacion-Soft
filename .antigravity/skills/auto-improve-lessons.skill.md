---
name: auto-improve-lessons
description: >
  After EVERY user correction, write a rule to tasks/lessons.md to prevent
  repeating the same mistake. Iterate until error rate drops to zero.
rules:
  - After any correction: append to @tasks/lessons.md using pattern:
    ## LESSON [date] — [category]
    **Mistake:** [what went wrong]
    **Rule:** [the constraint to never violate]
    **Applies to:** [files or modules affected]
  - Read @tasks/lessons.md at the START of every session before taking any action
  - Never mark a task complete if it triggered a correction in this session
  - Lessons are permanent — never delete entries, only append
  - Reference: https://github.com/EvoAgentX/EvoAgentX
---
