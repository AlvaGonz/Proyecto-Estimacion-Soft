---
name: cross-session-memory
---
# Skill: cross-session-memory
Activate on: session end · start new session · load memory · context sync · daily briefing
Behavior on SESSION START:
- Read tasks/session-memory.md (last 3 session summaries).
- Extract: top 3 active risks, top 3 patterns to avoid, current coverage health.
- Include this context in the agent's planning brief before any task starts.
- Log: MEMORY-LOADED: <N> sessions recalled, <N> patterns active

Behavior on SESSION END:
- Send to Groq (GROQ_MODEL_PRIMARY):
  "Summarize this development session in 5 bullet points.
   Include: what was fixed, what was learned, what is still blocked, top risk for next session.
   Format: SESSION: <date> | STATUS: <CLEAN/PARTIAL/BLOCKED> | <5 bullets>"
- Append Groq summary to tasks/session-memory.md (keep last 10 sessions max).
- Truncate oldest entries beyond 10.

Memory file: tasks/session-memory.md
Format:
## Session: <date> | Status: CLEAN/PARTIAL/BLOCKED
- Fixed: ...
- Learned: ...
- Blocked: ...
- Risk: ...
- Coverage: frontend N% | backend N%
