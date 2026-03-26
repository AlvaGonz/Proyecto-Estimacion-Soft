---
description: Remove unused files, unreachable code, and stale artifacts from the repo.
---
# /cleanup-dead-code — Dead Code Elimination

## Pre-conditions
- Run `/audit-chores` first if `AUDIT.md` is older than 24h.
- verify: `AUDIT.md` exists before starting.

## Steps

1. **Identify stale root-level files**: scan repo root for files that are not `package.json`, `vite.config.ts`, `tsconfig.json`, `AGENTS.md`, `docker-compose.yml`, `README.md`, `.env.example`.
   - verify: List of candidates produced. Each confirmed stale before deletion.

2. **Find unreachable exports**: check for named exports in `src/` and `server/src/` never imported anywhere.
   - verify: List produced with file path and export name.

3. **Remove confirmed dead files**: delete only files confirmed unused in step 1 and 2.
   - verify: `git status` shows only expected deletions — no accidental source file removals.

4. **Remove stale artifacts**: delete `.antigravity/`, `flatten-skills.ps1`, `test-evolution.mjs` and similar one-off scripts from repo root.
   - verify: `git status` diff matches expected list.

5. **Prune empty directories** after deletions.
   - verify: No empty `__tests__/` or feature directories remain.

6. **Run lint + typecheck after cleanup** to confirm no import breakage.
   - `npm run lint && npx tsc --noEmit`
   - verify: Both exit 0. Any error means a required file was accidentally removed — revert immediately.

7. **Commit**: `chore(cleanup): remove dead code and stale artifacts`
   - verify: Commit message follows conventional format.
