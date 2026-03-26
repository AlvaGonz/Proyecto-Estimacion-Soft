---
name: workflow-evolution
---
# Skill: workflow-evolution
Activate on: workflow complete · workflow blocked · optimize workflow · after any slash command finishes
Behavior:
- After any workflow (e.g., /audit-chores, /restructure-frontend) completes or gets BLOCKED:
  1. Record: steps taken, steps that caused retries, steps skipped.
  2. Send step log to Groq:
     "Given this workflow execution log, identify one structural improvement.
      Options: reorder steps, add a missing step, remove a redundant step, or split a step.
      Output: one specific change with reason. Max 3 sentences."
  3. If Groq proposes a change, apply it to the `.agent/workflows/<name>.md` file.
  4. Log: WORKFLOW-EVOLVED: /<name> — change: <description>
- Never restructure a workflow that completed with 0 retries (it's already optimal).
- Rate limit: max 3 workflow evolutions per session.
