# Workflow: post-task-hook

## Trigger
Runs AUTOMATICALLY after EVERY completed agent task — no exceptions.

## Steps

1. **Collect:** What was the task? What files were changed?
2. **Run:**
   ```bash
   python scripts/post_task_loop.py \
     --task "{{TASK_DESCRIPTION}}" \
     --output "{{FILES_CHANGED_AND_WHAT_WAS_DONE}}"
   ```
3. **Read stdout JSON result.**
4. If `high_issues > 0`: Read `tasks/loop-log.md`, address HIGH issues before committing.
5. If `verdict == PASS` or `high_issues == 0`: Proceed to commit.
6. **Commit includes loop result in message body:**
   ```
   type(scope): message

   loop: score={{score}} verdict={{verdict}} issues={{issues}}
   ```

## Non-Blocking Rule

The loop NEVER blocks task completion. It informs and archives.

- A score `< 60` is a **WARNING**, not a hard stop.
- Only `HIGH` severity issues with `verdict=FAIL` require addressing before commit.
- If `GROQ_API_KEY` is missing, the script exits `0` silently — never stalls the agent.

## Agent Reference

| Agent | Role | Model |
|---|---|---|
| 1 — Evaluator | Score 0-100 vs project rules | PRIMARY 70B |
| 2 — Critic | List issues + severity | PRIMARY 70B |
| 3 — Mutator | Propose minimal fix mutations | FAST 8B |
| 4 — Validator | Accept/reject mutations | FAST 8B |
| 5 — Archivist | Write to lessons.md / error-patterns.md | PRIMARY 70B |

## Output Files

| File | Content |
|---|---|
| `tasks/loop-log.md` | Human-readable run log |
| `tasks/lessons.md` | LESSON: rules extracted from issues |
| `tasks/error-patterns.md` | HIGH severity issue history |
| `~/.agent-loop/lessons.md` | Global cross-project lessons |
