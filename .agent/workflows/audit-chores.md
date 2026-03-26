---
description: Perform a comprehensive audit of the codebase structure, dead code, and architecture boundaries.
---
# /audit-chores — Comprehensive Codebase Audit

## Pre-conditions
- Load `.agent/rules/architecture.md` before starting.
- verify: File exists at `.agent/rules/architecture.md` — exit if missing.

## Steps

1. **Map repository layout** using `find_by_name` and `list_dir`.
   - verify: Output lists all directories under `src/`, `server/src/`, `.agent/`, `.github/workflows/`.

2. **Read `package.json` and `server/package.json`** to extract declared dependencies.
   - verify: Both files loaded. Dependency counts recorded.

3. **Detect unused frontend dependencies**: compare imports in `src/` against `package.json`.
   - verify: List of unused deps produced (or "none found" confirmed).

4. **Detect unused backend dependencies**: compare imports in `server/src/` against `server/package.json`.
   - verify: List of unused server deps produced.

5. **Check architecture boundary violations**:
   - `grep -r "from.*server/" src/` → must return 0 matches.
   - `grep -r "from.*src/" server/src/` → must return 0 matches pointing to frontend.
   - verify: Violations listed by file and line, or "CLEAN" confirmed.

6. **Identify monolithic files** (>300 lines):
   - verify: Files >300 lines are listed with line count and flagged for splitting.

7. **Check LDR domain coverage** (AGENTS.md Section 11): verify every required domain has both frontend feature and backend module directories.
   - verify: Missing domains listed as `[MISSING]: <domain>`.

8. **Output `AUDIT.md`** with findings table: domain, status, action required.
   - verify: File exists at repo root after workflow completes.
