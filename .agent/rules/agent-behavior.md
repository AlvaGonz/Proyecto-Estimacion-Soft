# Agent Behavior Rules — EstimaPro
# Loaded at the start of every session. All rules apply to all agents.

1. **PLAN FIRST.** Any task with 3+ steps must enter Planning mode before execution. Use the `orchestrator` skill. Never start writing code on a multi-step task without a written plan.
   - Example of WRONG: Starting to edit 5 files before stating a plan.
   - Example of CORRECT: "I will: (1) read the file, (2) propose change, (3) implement, (4) verify."

2. **ONE GOAL PER SUBAGENT.** Each agent receives exactly one well-defined objective. Never mix audit + feature work in the same agent run.
   - verify: Agent task description contains exactly one "Objective:" statement.

3. **READ LESSONS FIRST.** Open `tasks/lessons.md` at the start of any non-trivial task. Never repeat a mistake that has already been logged as a LESSON: entry.
   - verify: `tasks/lessons.md` opened and scanned before first file edit.

4. **TEST BEFORE DONE.** Never mark a task complete without running lint, build, and tests. Use the `tdd-workflow` skill. Document exact failure if tests cannot pass yet.
   - verify: `npm run lint && npx tsc --noEmit && npx vitest run` all exit 0 before claiming DONE.

5. **MINIMAL IMPACT.** Change at most 3 files per task without explicit user approval. If more than 3 files must change, stop and ask the user to confirm scope before proceeding. No opportunistic refactors that were not part of the stated task.
   - Example of scope expansion (FORBIDDEN): Refactoring unrelated function while fixing a bug.
   - verify: `git diff --name-only` must list ≤ 3 files per commit unless user explicitly expanded scope.

6. **NO SECRETS IN REPO.** Never commit `.env`, hardcoded API keys, JWT secrets, Mongo URIs, SMTP credentials, or Groq keys. These live in `.env` only and `.env` is gitignored.
   - verify: Before every push — `git diff HEAD | grep -iE "(api_key|secret|mongo_uri|jwt)"` must return 0 matches outside `*.md` and `*.example` files.

7. **AUDIT LOG ALWAYS.** Every state-changing operation (create/update/delete on DB entities) must write to LOGAUDITORIA. If an implementation skips this, flag it as a blocking gap before marking done.
   - verify: Every new controller method that mutates data calls `auditLogService.log(...)`.

8. **ROOT CAUSE FIRST.** When fixing a bug, identify the root cause before writing the fix. A band-aid fix that masks a deeper issue is not acceptable.
   - Example of WRONG: Catching an error silently to stop the test from failing.
   - Example of CORRECT: Tracing the error to its source file and line, then fixing the condition there.
   - verify: Bug fix commit message includes "Root cause:" in the description.

9. **WRITE LESSONS.** When a correction is made or a reversal occurs, use `agentic-eval` to write one durable rule to `tasks/lessons.md`. Always format as: `LESSON: <domain> — <what happened> — <durable rule derived>`.

10. **SENIOR APPROVAL TEST.** Before finalizing any implementation, ask: "Would a senior engineer approve this?" If the answer is uncertain, simplify before submitting to the critic gate.
    - verify: If uncertain, reduce scope and resubmit rather than guessing approval.
