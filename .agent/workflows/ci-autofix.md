---
description: Autofix CI failures using GitHub MCP logs + error-pattern-mining + tdd-workflow + critic gate.
---
# /ci-autofix — CI Failure Auto-Heal Loop

## Pre-conditions
- GitHub MCP must be connected and live.
  - verify: Test with `github MCP → list_repositories(owner=AlvaGonz)` returns repo list before proceeding.
- `error-pattern-mining` skill loaded.
- `tdd-workflow` skill loaded.

## Steps

1. **Read CI failure logs via GitHub MCP**.
   - `get_workflow_run_logs(run_id=<id>, repo=AlvaGonz/Proyecto-Estimacion-Soft)`
   - verify: Logs loaded. Failed job name and step identified. Error message captured.

2. **Root cause analysis** via `sequential-thinking` MCP.
   - Structure a reasoning chain: symptom → direct cause → root cause → affected file(s).
   - verify: Root cause identified with file path and line reference (not just "something failed").

3. **Extract error pattern** via `error-pattern-mining` skill.
   - Send failure description to Groq (llama-3.1-8b-instant).
   - verify: Valid `PATTERN: ci — ...` line returned and appended to `tasks/error-patterns.md`.

4. **Write a failing test** via `tdd-workflow` skill (RED phase).
   - The test must reproduce the exact CI failure locally.
   - verify: `npx vitest run <test-file>` exits with ≥ 1 FAIL — log output as evidence.

5. **Apply minimal fix** (GREEN phase).
   - Change only the file identified in step 2. Do not touch unrelated code.
   - verify: `npx vitest run <test-file>` exits 0 with 1 PASS.

6. **Run full validation suite**.
   - `npm run lint && npx tsc --noEmit && npx vitest run`
   - `cd server && npx vitest run`
   - verify: All commands exit 0. No new failures introduced.

7. **Submit to critic gate**.
   - verify: Critic scores all axes ≥ 7 and outputs the exact string `CRITIC-APPROVED`.

8. **Push fix**.
   - `git add <changed-files> && git commit -m "fix(<domain>): <root-cause-description>" && git push origin <branch>`
   - verify: New CI run triggered on GitHub. Monitor for green within 10 minutes via GitHub MCP.
