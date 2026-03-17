# Findings & Discoveries — E2E Compliance Audit

## LDR Compliance Map (RF001–RF034)

| RF    | Requirement                       | Test Covered       | Status    |
|-------|-----------------------------------|--------------------|-----------|
| RF001 | User Registration                 | GAP                | PENDING   |
| RF002 | Login / Auth                      | T001, T002, T003   | PASS ✅   |
| RF003 | Role Assignment                   | global-setup (API) | PASS ✅   |
| RF004 | Permissions (RBAC)                | T004, T039, T040   | PASS ✅   |
| RF005 | Admin User Management             | GAP                | PENDING   |
| RF006 | Create Estimation Project         | T010, T011, T012   | PASS ✅   |
| RF007 | Update Project                    | GAP                | PENDING   |
| RF008 | Manage Tasks                      | T021, T027         | PENDING   |
| RF009 | Assign Experts                    | T012 (Step 4)      | PASS ✅   |
| RF010 | Documentation per Project         | T024 (Docs tab)    | PENDING   |
| RF026 | Facilitator Control Panel         | dashboard.spec.ts  | PASS ✅   |
| RF029 | Historic Register (Audit Log)     | T034               | PASS ✅   |

## Technical Discoveries:
- **Enum Mismatch**: Frontend used capitalized Spanish strings for Roles (`Administrador`), while Backend used lowercase English identifiers (`admin`). Result: Permission gates (`PermissionGate`) failed even after login.
- ** userService **: API interaction was broken; `getAllUsers` expected `response.users` but `fetchApi` already extracts the `data` array. Result: Expert list empty in Wizard. **FIXED**.
- **T012 failure**: The test was failing due to `400 Bad Request` in project creation (invalid `expertIds` format and missing name validation). Combined with server-side `_id` vs `id` mismatch in JSON responses.
- **Model ID Mapping**: Mongoose models (`User`, `Project`, `Task`) were outputting `_id` instead of `id` as string. Added `toJSON` transforms to ensure consistency with frontend `types.ts`. **FIXED**.
- **Wizard Navigation**: Manual `setStep` in `ProjectForm` was flakier than using `type="submit"` but `type="submit"` was triggering native browser 'required' popups that blocked Playwright. Unified with `handleNextStep` and manual `type="button"`. **FIXED**.

## Detected Gaps:
- RF001 (Registration UI): Exists in `App.tsx`? No registration UI found, only login. Needs implementation or mapping.
- RF005 (Admin Panel): `AdminPanel.tsx` exists but is not linked in UI for Admins or needs explicit E2E.
- RF015 (Statistics): Formulas implemented in `utils/statistics.ts` but need automated E2E verification of visual outcomes.
