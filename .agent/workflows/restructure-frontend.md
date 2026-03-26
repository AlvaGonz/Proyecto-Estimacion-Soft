---
description: Enforce src/features/<domain>/ structure across the frontend codebase.
---
# /restructure-frontend — Feature-Based Directory Restructure

## Pre-conditions
- Load `.agent/rules/architecture.md`.
- verify: `src/features/` directory exists (create it if missing before proceeding).

## Steps

1. **Identify all current component files** in `src/components/` that contain domain-specific logic.
   - verify: List of candidates produced (e.g., components that fetch data or call APIs directly).

2. **Map each component to its target domain** based on AGENTS.md Section 11 LDR coverage table.
   - verify: Every candidate has a confirmed target domain before any file is moved.

3. **Move domain components** to `src/features/<domain>/` one domain at a time.
   - Never move more than one domain per agent run.
   - verify: After each move — `npm run lint && npx tsc --noEmit` exits 0.

4. **Update all import paths** referencing moved files.
   - verify: `grep -r "from.*components/<moved-component>" src/` returns 0 matches.

5. **Move domain-specific hooks** to `src/features/<domain>/hooks/`.
   - verify: No domain hook remains in `src/hooks/` (only shared hooks allowed there).

6. **Confirm `src/components/` contains only reusable UI** (no domain logic, no API calls).
   - verify: `grep -r "fetch\|axios\|useQuery\|useMutation" src/components/` returns 0 matches in non-service files.

7. **Run full test suite**: `npx vitest run --coverage`
   - verify: Coverage ≥ 80%. No new test failures introduced.

8. **Commit**: `refactor(frontend): migrate <domain> to src/features/<domain>/`
   - verify: Conventional commit format confirmed.
