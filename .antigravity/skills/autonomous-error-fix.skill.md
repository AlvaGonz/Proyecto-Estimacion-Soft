---
name: autonomous-error-fix
description: >
  When an error report, CI failure, or failed test is received:
  fix it autonomously. Read the stack trace, find root cause,
  write a failing test that catches the bug, then fix it.
  Never ask user to change context. Never revert to zombie state.
rules:
  - On error received: read full stack trace — identify EXACT line of failure
  - Explain root cause in 2 sentences before touching any code
  - Step 1: Write a failing test that reproduces the bug (Failing-Test-First loop)
  - Step 2: Fix the source — minimal surgical change only
  - Step 3: Confirm the test passes
  - Step 4: Run full suite to check for regressions
  - For CI failures: grep the GitHub Actions log for "Error:" and "FAILED" first
  - Never use workarounds like try/catch swallowing or // @ts-ignore
  - Commit format: fix([scope]): [root cause description] — closes #[issue]
  - Reference: https://github.blog/ai-and-ml/automate-repository-tasks-with-github-agentic-workflows/
---
