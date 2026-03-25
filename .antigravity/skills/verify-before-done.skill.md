---
name: verify-before-done
description: >
  Never mark a task DONE without proving it works. Runs the test suite,
  checks logs, and compares behavior against main before closing any task.
  Implements TDD Green Phase (make tests pass) + Refactor Phase (clean while green).
rules:
  - Before marking complete: run `npm run test` (frontend) AND `cd server && npm run test`
  - If tests fail: fix the failure BEFORE any other action — never skip
  - After implementation: ask "Would a senior engineer approve this?"
  - Compare changed behavior vs main branch: `git diff main -- [changed files]`
  - For UI changes: run `npm run e2e` if the change touches a Playwright-covered flow
  - For CI failures: read the full log, identify root cause, fix — do not ask user to change context
  - TDD Reference: https://github.com/github/awesome-copilot (TDD Green Phase skill)
---
