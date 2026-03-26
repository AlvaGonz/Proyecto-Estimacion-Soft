---
name: coverage-evolution
---
# Skill: coverage-evolution
Activate on: coverage gap · missing tests · 0% coverage · after test report · test backlog
Behavior:
- Read tasks/TEST-REPORT.md coverage gaps section.
- For each domain with < 20% coverage:
  1. Send to Groq (GROQ_MODEL_FAST):
     "For the domain <domain> in a Node.js/Express/MongoDB API, list the 3 highest-value
      unit test cases that would most efficiently raise coverage from 0% to ≥ 30%.
      Format each as: TEST: <function name> — <scenario> — <expected outcome>"
  2. Append Groq output to tasks/test-backlog.md under ## <domain>.
- Update tasks/TEST-REPORT.md coverage gap section with `[BACKLOG CREATED]` status.
- Rate limit: max 5 domains per session (Groq token budget).
- Do NOT write the actual tests — only the specs. Tests are written by tdd-workflow skill.

Output file: tasks/test-backlog.md
Format:
## <domain>
- TEST: <function> — <scenario> — <expected outcome>
