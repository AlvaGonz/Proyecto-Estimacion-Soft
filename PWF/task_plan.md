# Task Plan: E2E Audit & Compliance (RF001–RF034)

## Objective
Execute a complete audit of the platform using Playwright to ensure compliance with the LDR requirements, fixing bugs as they are found.

## Phases
### Phase 1: Dashboard Audit (SPEC 1) [COMPLETE]
- [x] Run `dashboard.spec.ts`.
- [x] Verify RF026 (Facilitator Dashboard), RF004 (RBAC), RF029 (Audit History).
- [x] Log results and update findings.

### Phase 2: Projects & Wizard Audit (SPEC 2) [COMPLETE]
- [x] Fix `userService.ts` (experts loading).
- [x] Fix `UserRole` enum discordance.
- [x] Run `projects.spec.ts`.
- [x] Verify RF006 (Creation), RF007 (Update), RF008 (Tasks), RF009 (Experts), RF031 (Method Selection).
- [x] Fix failing test `T012` (Wideband Delphi Creation). (Zod validation & Step guards fixed).
- [x] Fix failing test `T010` (Mandatory name) & `T011` (Valid advancement).
- [x] Correct server-side ID mapping in models (User, Project, Task).

### Phase 3: Delphi Flow Audit (SPEC 3) [IN_PROGRESS]
- [ ] Run `estimation-rounds.spec.ts`.
- [ ] Verify RF012 (Individual Register), RF013 (Anonymity), RF014 (Justification).

### Phase 4: Statistics & Rounds Audit (SPEC 4) [PLANNED]
- [ ] Verify RF015 (Metrics), RF016 (Outliers IQR), RF017/RF018 (Graphs).

### Phase 5: Method-Specific Audit (SPEC 5) [PLANNED]
- [ ] Run `three-point.spec.ts`.
- [ ] Verify RF032 (Adaptive UI), RF015c (PERT).

### Phase 6: Gap Remediation [PLANNED]
- [ ] Implement missing tests for RF001, RF005, RF028.

## Current Focus
- Fixing `T012` in `projects.spec.ts`. Error: `getByText('Sistema Biblioteca ...')` not found after creation.

## Error Log
- `T012`: Timeout waiting for project card. Likely needs `networkidle` or form submission verification.
- `userService`: Returned `[]` for experts. **FIXED**.
- `UserRoles`: Mismatch between 'Administrador' and 'admin'. **FIXED**.
