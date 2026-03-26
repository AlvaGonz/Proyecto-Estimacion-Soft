---
description: Load cross-session memory and surface top risks from previous sessions.
---
# /memory-sync — Cross-Session Memory Load

## Trigger
Run at every session start (automatic). Also invoke manually after a gap of > 24h.

## Steps

1. **Read `tasks/session-memory.md`** — load the last 3 session entries.
   - verify: File exists and contains ≥ 1 `SESSION:` block. If missing → log `MEMORY-COLD-START` and continue.

2. **Surface top 3 risks**: scan all session entries for `- Risk:` lines → pick the 3 most recent non-resolved risks.
   - verify: Top 3 risks listed in session planning brief.

3. **Surface top 3 patterns to avoid**: scan `tasks/error-patterns.md` for the 3 most-recently-appended `PATTERN:` lines.
   - verify: Patterns loaded and referenced in current session context.

4. **Load unresolved lessons**: read `tasks/lessons.md` — identify any `LESSON:` entries not yet acted on.
   - verify: Unresolved lessons listed (or "ALL RESOLVED" confirmed).

5. **Log**: `MEMORY-SYNC: <N> sessions recalled | <M> risks surfaced | <K> patterns loaded`
   - verify: Log line written to terminal output before proceeding with the task.

## Global Sync Step (run after any Groq evolution pass that improves rules/workflows)
After every successful evolution pass (`/evolve-prompts`, `/evolve-skills`, or `rules-evolver` agent):
```bash
cp -r .agent/skills ~/.agent-loop/templates/skills
cp -r .agent/rules ~/.agent-loop/templates/rules
cp -r .agent/workflows ~/.agent-loop/templates/workflows
cp AGENTS.md ~/.agent-loop/templates/AGENTS.md
cp .github/AGENTS.md ~/.agent-loop/templates/.github/AGENTS.md 2>/dev/null || true
```
- verify: `~/.agent-loop/templates/rules/architecture.md` timestamp is newer than `.agent/rules/architecture.md`.
- This ensures every future project bootstrapped with `new_project_setup.sh` gets the latest evolved agent rules automatically.
