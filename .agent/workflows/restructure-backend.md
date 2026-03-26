---
description: Move and enforce server/src/modules/<domain>/ structure across the backend.
---
# /restructure-backend — Domain-Module Directory Restructure

## Pre-conditions
- Load `.agent/rules/architecture.md`.
- verify: `server/src/modules/` directory exists.

## Steps

1. **Audit current backend structure**: list all files in `server/src/` that are NOT inside `server/src/modules/`.
   - verify: Candidates listed by path.

2. **Map each file to its target domain module** per AGENTS.md Section 11 LDR coverage table.
   - verify: Every file has a confirmed target module path before moving.

3. **Move files domain by domain** (one domain per agent run): controller → service → routes → validators → model.
   - verify: After each file move — `cd server && npx tsc --noEmit` exits 0.

4. **Update all import paths** in affected files.
   - verify: `grep -r "from.*\/controllers\|from.*\/services\|from.*\/routes" server/src/modules/` returns 0 matches using old flat paths.

5. **Verify `server/src/shared/`** contains only truly shared utilities (no domain-specific logic).
   - verify: `grep -r "from.*modules/" server/src/shared/` returns 0 matches (shared must not import domains).

6. **Register updated routes** in `server/src/app.ts` (or main router file).
   - verify: All domain route files are imported and mounted in the main app.

7. **Run backend tests**: `cd server && npx vitest run`
   - verify: Exit 0, no new failures.

8. **Commit**: `refactor(backend): migrate <domain> to server/src/modules/<domain>/`
   - verify: Conventional commit format confirmed.
