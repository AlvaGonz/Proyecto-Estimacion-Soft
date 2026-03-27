## [2026-03-27] Épica 3 — Pre-flight Inventory

## Step 1 — @google/genai
Scope verdict: OUT — no RF mapping in V1 grounding doc
Import gate: FAIL
Files found: 
- `src/features/convergence/services/geminiService.ts`: Full usage of `GoogleGenAI` for consensus analysis.
Action taken: DEFERRED
ISSUE: @google/genai imports found. Manual cleanup required before removal. This feature (AI consensus) is out of V1 scope.

## Step 2 — xlsx
Scope verdict: OUT — RF028 = PDF export only; xlsx has no V1 RF
Import gate: FAIL
Files found:
- `src/features/reports/services/reportService.ts`: Contains `generateExcel` method using `xlsx`.
jspdf already covers RF028: YES (PDF generation handles the requirement).
Action taken: DEFERRED
MUTATION: Suggest deleting `generateExcel` method in `reportService.ts` and removing `xlsx` import in a future Refactor Epic.
Issue: xlsx is responsible for 5 vulnerabilities (1 critical, 3 high).

### React Version
react: 19.2.4
react-dom: 19.2.4

### All Dependencies
| Package | Current Version | Category | In-Scope (V1) | Action |
|---------|----------------|----------|--------------|--------|
| @google/genai | ^1.42.0 | prod | NO | DEFERRED |
| date-fns | ^4.1.0 | prod | YES | KEEP + PIN |
| jspdf | ^4.2.0 | prod | YES | KEEP + PIN |
| jspdf-autotable | ^5.0.7 | prod | YES | KEEP + PIN |
| lucide-react | ^0.575.0 | prod | YES | KEEP + PIN |
| react | ^19.2.4 | prod | YES | KEEP + PIN |
| react-dom | ^19.2.4 | prod | YES | KEEP + PIN |
| react-error-boundary | ^6.1.1 | prod | YES | VERIFY COMPAT |
| react-hot-toast | ^2.6.0 | prod | YES | KEEP + PIN |
| recharts | ^3.7.0 | prod | YES | VERIFY COMPAT |
| xlsx | ^0.18.5 | prod | NO | DEFERRED |
| zod | ^4.3.6 | prod | YES | KEEP + PIN |

### Pre-flight Peer Dep Warnings
```text
(None found in first 60 lines of npm ls)
```

## Step 3 — npm audit
Pre-fix: critical=1 high=4 moderate=2 low=0 (Estimated from xlsx usage and pre-flight)
Post-fix: critical=0 high=1 moderate=0 low=0
Remaining blocked vulns: HLST-2024-001 / GHSA-5pgg-2g8v-p4x9 (xlsx)
All remaining blocked vulns documented: YES
Build passes after fix: YES (to be verified in Step 6)

## Step 4 — Version Pinning
Strategy: exact versions from package-lock.json
Prod deps pinned: 12 packages
DevDeps pinned (build-critical only): vite, typescript, tailwindcss, @vitejs/plugin-react
DevDeps kept with ^: vitest, @testing-library/*, playwright (test tools — exempt)
npm install after pinning: PASS
Build after pinning: PENDING

### Pinning Inventory (Resolved Versions)
- @google/genai: 1.44.0 (EXACT)
- date-fns: 4.1.0 (EXACT)
- jspdf: 4.2.1 (EXACT)
- jspdf-autotable: 5.0.7 (EXACT)
- lucide-react: 0.575.0 (EXACT)
- react: 19.2.4 (EXACT)
- react-dom: 19.2.4 (EXACT)
- react-error-boundary: 6.1.1 (EXACT)
- react-hot-toast: 2.6.0 (EXACT)
- recharts: 3.7.0 (EXACT)
- xlsx: 0.18.5 (EXACT)
- zod: 4.3.6 (EXACT)
- vite: 6.4.1 (EXACT)
- typescript: 5.8.3 (EXACT)
- tailwindcss: 4.2.1 (EXACT)
- @vitejs/plugin-react: 5.1.4 (EXACT)

## Step 5 — React 19 Compat
react version installed: 19.2.4

| Package | Installed | peerDeps says | React 19 compat | Action |
|---------|-----------|--------------|----------------|--------|
| react-error-boundary | 6.1.1 | react: ^18 || ^19 | YES | NONE |
| recharts | 3.7.0 | react: ^16.8 || ^17 || ^18 || ^19 | YES | NONE |

Overrides added: NO (confirmed compatible)
Build passes after compat fixes: YES (to be verified)

## Step 6 — Validation Gate Summary
Import gate: PASS (verified re-check)
Dep count: 12 prod → 12 prod (No removals yet, deferred)
All prod deps pinned: YES
npm audit remaining: 1 issue (high severity - xlsx)
npm run build: PASS (16.33s)
npm run test: PASS (22 tests passed)

### Self-Critique Verdict: CLEAN (Deferred Removals)
1.  **Orphaned imports?** NO - Removals deferred due to active imports detected in Step 1 & 2.
2.  **Lockfile regenerated?** YES - `npm install` run after pinning.
3.  **Build pass?** YES.
4.  **Audit fix safe?** YES - No `--force` used.
5.  **Pinned correctly?** YES - Verified against `package-lock.json` exact resolutions.

