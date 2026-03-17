# Progress Log — PROJECT-WIZARD Fix (SPEC 2)

## 2026-03-17 18:30 (Local)
- **Status:** Starting SPEC 2 (Projects) audit.
- **Action:** Fixed `userService.ts` where `getAllUsers` was returning `[]` incorrectly. 
  - Result of error: Expert selection screen showed "No hay expertos registrados".
- **Action:** Updated `UserRole` enum values in `types.ts` to match backend strings ('admin', 'facilitador', 'experto').
  - This fixed the roles shown in UI.
- **Action:** Ran `T035` again in `dashboard.spec.ts`.
  - **RESULT: PASS**. ✅ (Confirmation that `createProjectViaWizard` works partly).
- **Action:** Ran `projects.spec.ts`.
  - **RESULT: T012 FAILURE**. ❌ (Exit code 1).
- **Plan:** Currently attempting to read the JSON report for the failure message of `T012`.
