---
description: Verify frontend/backend/DB layer separation is not violated.
---
# /verify-boundaries — Architecture Boundary Verification

## Pre-conditions
- Load `.agent/rules/architecture.md`.

## Steps

1. **Frontend → Backend boundary**: confirm frontend never imports server-side code.
   - Command: `grep -r "from.*server/" src/`
   - verify: Exit 0 with 0 matches. Any match is a CRITICAL violation — log file + line.

2. **Backend → Frontend boundary**: confirm server never imports frontend files.
   - Command: `grep -rE "from.*['\"]\.\.?/\.\.?/(src|components|features)" server/src/`
   - verify: 0 matches. Violations flagged immediately.

3. **Database access boundary**: confirm Mongoose is only called from module model or service files.
   - Command: `grep -r "\.find\(\|\.findOne\(\|\.save\(\|\.create\(" server/src/ --include="*.ts" | grep -v "modules\|shared/utils"`
   - verify: 0 matches outside allowed files.

4. **Business logic in frontend check**: no stat calculations in React components.
   - Command: `grep -r "mean\|stdDev\|variance\|IQR\|outlier" src/features/ --include="*.tsx"`
   - verify: 0 matches in component files (only allowed in dedicated util files).

5. **API call isolation**: direct `fetch` or `axios` calls only inside `*Service.ts` files.
   - Command: `grep -rn "fetch(" src/ | grep -v "Service.ts\|service.ts"`
   - verify: 0 matches.

6. **Output boundary report**: list each check with CLEAN or VIOLATION + file:line.
   - verify: Report produced even if all checks are CLEAN.
