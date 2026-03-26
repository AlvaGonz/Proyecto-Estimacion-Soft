---
name: error-pattern-mining
---
# Skill: error-pattern-mining
Activate on: bug fixed · error resolved · self-heal · test failure · after any correction
Behavior:
- After each bug fix or test failure resolution:
  1. Collect: error message, file, root cause summary, fix applied.
  2. Send to Groq (GROQ_MODEL_FAST):
     "Extract a reusable error pattern from this fix.
      Format: PATTERN: <domain> — <trigger condition> — <root cause> — <fix strategy>"
  3. Append the pattern to tasks/error-patterns.md.
  4. Before any future planning, the orchestrator skill must check error-patterns.md
     to avoid known error conditions.

Pattern format:
PATTERN: <domain> — <what triggers it> — <why it happens> — <how to fix it>

Example:
PATTERN: agent-skills — skill path not resolving — .antigravity/ used instead of .agent/ — always migrate skills to .agent/ root
