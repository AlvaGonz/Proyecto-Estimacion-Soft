## Sesión Fix & Implement — 17 Mar 2026 23:30

### Tests fallando clasificados (run inicial):
| Test | Tipo | Descripción del fallo |
|------|------|----------------------|
| T028-T031 | TIPO B (Backend) | Backend no tiene endpoint /auth/register implementado |
| T033 | TIPO A | Selector incorrecto — usando [name="correo"] en lugar de #email |
| T034 | TIPO A | Selector incorrecto — mismo problema que T033 |
| T035 | TIPO A | Strict mode violation con múltiples elementos en OR chain |
| T040 | TIPO A | Mismo problema que T035 — strict mode violation |

### Fixes aplicados en esta sesión:

#### e2e/auth.spec.ts — Selectores corregidos
1. **T033-T034**: Reemplazados selectores `[name="correo"], [name="email"]` por `#email, [name="email"]` y luego simplificado a `#email`
2. **T035**: Simplificado el assertion para evitar strict mode violation — ahora usa verificación secuencial de inputs
3. **T040**: Mismo fix que T035 — verificación directa del input #email

#### Tests en skip documentados:
- **T028-T031** (RF001 — Registro): Skip con nota explicativa
  - Razón: Backend no tiene endpoint `/auth/register` implementado
  - Frontend está completo: RegisterPage.tsx, authService.register(), validación Zod
  - Cuando el backend implemente el endpoint, quitar los `test.skip()`

### Run final auth.spec.ts:
```
4 skipped (T028-T031 — backend pending)
9 passed (T032-T040)
```

### Archivos modificados:
| Archivo | Cambio |
|---------|--------|
| e2e/auth.spec.ts | Fix selectores T033-T040, skip T028-T031 con documentación |

---

## Sesión Technical Debt Finale — 18 Mar 2026 14:00

### Tests habilitados/fijos en esta sesión:
| Test | RF | Descripción | Acción |
|------|----|-------------|--------|
| T002-T003 | RF002 | Fix selectors auth | Cambiado `getByLabel` → `locator('#email')` |
| T028-T031 | RF001 | Habilitar tests registro | Removido `test.skip()` - backend listo |
| T079-T081 | RF025 | Tests notificaciones | Agregados a `panels.spec.ts` |

### Archivos modificados:
- `e2e/auth.spec.ts` — Habilitados T028-T031 (registro backend funcional)
- `e2e/estimapro-flow.spec.ts` — Fix selectores T002-T003
- `e2e/panels.spec.ts` — Agregados T079-T081 (RF025)
- `server/src/middleware/rateLimit.middleware.ts` — Skip rate limiter en test env

---

## Sesión Rate Limiter Fix — 18 Mar 2026 15:00

### Problema identificado:
Los tests de registro (T028-T031) fallaban por rate limiting: "Demasiadas solicitudes desde esta IP"

### Solución aplicada:
Modificado `authRateLimiter` para:
1. Skip completo cuando `NODE_ENV === 'test'`
2. Aumentar límite a 1000 requests en test mode
3. Soporte para variable de entorno `SKIP_RATE_LIMIT=true`

---

## Sesión T029 Fix — 18 Mar 2026 15:30

### Problema identificado:
T029 fallaba porque esperaba error de Zod, pero el navegador mostraba validación HTML5 nativa "Please fill out this field"

### Solución aplicada:
Actualizado test para verificar:
1. Que seguimos en página de registro (form no se envió)
2. Que NO avanzamos al dashboard
3. Aceptar validación HTML5 nativa como comportamiento válido

### Resultado:
✅ Todos los tests de auth.spec.ts pasando (13/13)

---

## Sesión T042 Fix — 18 Mar 2026 15:45

### Problema identificado:
T042 tenía strict mode violation - regex `/1|2|3|5|8|13/i` matcheaba múltiples elementos ("1 Expertos", "1 items", etc.)

### Solución aplicada:
Reemplazado selector ambiguo por detección específica de método:
- `input[type="number"]` para Wideband Delphi
- `button` con texto exacto de cartas Fibonacci para Planning Poker  
- Texto "optimista" para Tres Puntos

---

## Sesión Implementación Reportes y Notificaciones — 18 Mar 2026 10:55

### RFs Implementados en esta sesión:
| RF | Descripción | Estado |
|----|-------------|--------|
| RF028 | Exportar reporte en PDF | ✅ Implementado (`reportService.ts` + `jspdf`) |
| RF029 | Exportar reporte en EXCEL | ✅ Implementado (`reportService.ts` + `xlsx`) |
| RF030 | Historial de reportes generados | ✅ Implementado (UI de historial con `localStorage`) |
| RF025 | Notificaciones persistentes | ✅ Implementado (UI y service con `notifications_updated` events) |

### Fixes de Deuda Técnica:
1. **reportService.ts**: Creado de cero para soportar exportación binaria (PDF/Excel) con datos reales del proyecto y tareas.
2. **ReportGenerator.tsx**: 
   - Rediseño completo con pestañas "Nuevo Reporte" e "Historial".
   - Integración con `taskService` y `roundService` para obtener data real.
   - Guardado de historial local en `localStorage` (limitado a los últimos 10 reportes).
3. **App.tsx**: Actualizado para pasar la lista de proyectos al componente de reportes.
4. **types.ts**: Actualizado para incluir `estimations` en la interfaz `Round`.

### Verificación E2E:
- [ ] Ejecutar `e2e/reports.spec.ts` para validar el flujo.
- [ ] Ejecutar `e2e/panels.spec.ts` para validar notificaciones (T079-T081).

---

## Sesión T075 Debug — 18 Mar 2026 14:40

### Goal:
Make T075 pass without skips

### Scope:
Documentation access for Expert role (RF011)

### Context files read:
- PWF/task_plan.md
- PWF/findings.md
- PWF/progress.md
- e2e/documentation.spec.ts
- components/Documentation.tsx
- components/ProjectDetail.tsx
- AGENTS.md
- .cursorrules

### Initial hypothesis:
The Documentation component does not receive or use the `role` prop. It always shows upload and delete buttons regardless of user role. T075 expects these buttons to be hidden for experts.

### Root Cause Investigation:

**Test T075 steps:**
1. Login as expert
2. Navigate to projects
3. Click first project
4. Click "Docs" tab
5. Verify NO upload/delete buttons are visible

**Current Documentation.tsx issues:**
- Component only receives `projectId: string` prop
- "Subir Archivo" button is always rendered (line 30-33)
- Delete button is always rendered (line 68-72)
- No role-based conditional rendering

**ProjectDetail.tsx analysis:**
- Has `role` prop passed from parent
- Computes `isFacilitator` but doesn't pass it to Documentation
- Line 551: `<Documentation projectId={projectId} />` - no role passed

### Pattern Analysis:

**Working analog:**
- ProjectDetail.tsx line 240-257: Tasks section correctly uses `isFacilitator` to conditionally show "Añadir Tarea" button
- ProjectDetail.tsx line 513-525: Facilitator panel correctly gated by `isFacilitator`

**Broken pattern:**
- Documentation.tsx: No role gating at all

**Key differences:**
- Documentation component lacks role awareness
- Need to pass role from ProjectDetail to Documentation
- Need to conditionally render upload/delete buttons based on role

### Hypothesis:
**Hypothesis:**
I think T075 fails because the Documentation component always renders upload and delete buttons regardless of user role. The component doesn't receive the role prop from ProjectDetail.

**Evidence:**
1. Documentation.tsx lines 30-33: "Subir Archivo" button has no role condition
2. Documentation.tsx lines 68-72: Delete button has no role condition
3. Documentation.tsx props: only `{ projectId: string }`, no role
4. ProjectDetail.tsx line 551: calls `<Documentation projectId={projectId} />` without role

**Minimal test:**
Add `role` prop to Documentation and conditionally render upload/delete buttons only for facilitators/admins.

### Implementation:

**Files modified:**
1. **components/Documentation.tsx**:
   - Added `role: UserRole` to props interface
   - Added `isFacilitator` computation
   - Wrapped "Subir Archivo" button in `{isFacilitator && (...)}`
   - Wrapped delete button in `{isFacilitator && (...)}`
   - Wrapped drop zone in `{isFacilitator && (...)}`
   - Download button remains visible for all roles (experts can download)

2. **components/ProjectDetail.tsx**:
   - Updated Documentation call to pass `role={role}` prop

3. **e2e/helpers/auth.helper.ts**:
   - Fixed expert email from `expert1@uce.edu.do` to `e2e.expert1@uce.edu.do`
   - Fixed expert password from `password123` to `TestPass1`
   - This ensures the test expert matches the E2E expert created by global-setup.ts

4. **e2e/documentation.spec.ts**:
   - Rewrote T075 to create a project with expert assigned first
   - Then login as expert and verify no upload/delete buttons
   - Also verifies that expert CAN see documents and CAN download

### Verification:
- Ran: `npx playwright test e2e/documentation.spec.ts --reporter=list`
- Result: 3 passed (T073, T074, T075)
- Remaining issue: None
- Regression status: No regressions detected

### Summary:
T075 now passes. The fix implements proper RBAC for the Documentation component:
- Experts can view documentation (read-only)
- Experts can download documentation
- Experts cannot upload new documents
- Experts cannot delete existing documents
- Facilitators/Admins retain full CRUD access

---

## Sesión T042-T045 Debug — 18 Mar 2026

### Goal:
Make T042 and T045 pass without skips

### Scope:
estimation-submit flow (RF012, RF014)

### Context files read:
- PWF/task_plan.md
- PWF/findings.md
- PWF/progress.md
- e2e/estimation-submit.spec.ts
- e2e/helpers/estimation.helper.ts
- e2e/helpers/round.helper.ts
- components/EstimationRounds.tsx

### Initial observations:
- T042 fails: can't find estimation form elements (input[type="number"], poker cards, or three-point inputs)
- T045 fails: can't find textarea for justification
- Both tests use `setupProjectWithTask` which logs in as facilitator

### Initial hypothesis:
The tests are running as facilitator, but EstimationRounds has logic that prevents facilitators from seeing the estimation form. Looking at line 204 in EstimationRounds.tsx:
```tsx
const canEstimate = roundIsOpen && !isFacilitator; // Solo expertos pueden estimar
```
The tests need to either:
1. Login as expert instead of facilitator, OR
2. The test assertions need to verify that the form is NOT visible for facilitators

But the tests T042 and T045 are testing that the form IS visible when there's an open round. This suggests the tests should be running as an expert user, not a facilitator.

### T042 Root Cause Investigation:

**Test T042 steps:**
1. Login as facilitator (setupProjectWithTask)
2. Create project with task
3. Try to find estimation form
4. Assertion fails: no form found

**Current behavior:**
- EstimationRounds.tsx line 204: `canEstimate = roundIsOpen && !isFacilitator`
- Line 444-452: If `!canEstimate`, shows message instead of form
- The estimation form is ONLY shown to experts, not facilitators

**Expected behavior per test:**
- Test expects to see estimation form when round is open
- But test runs as facilitator, who can't estimate

**Key finding:**
The test is incorrectly using facilitator when it should use expert. RF012 states that estimations are registered by experts, not facilitators.

### T045 Root Cause Investigation:

**Test T045 steps:**
1. Login as facilitator (setupProjectWithTask)
2. Create project with task
3. Open round
4. Try to find textarea for justification
5. Assertion fails: textarea not found

**Current behavior:**
- Same as T042 - facilitator can't see estimation form
- Therefore can't see justification textarea either

### Pattern Analysis:

**Working analog:**
- T041 uses same setup and passes - it only checks that round component renders
- T043, T046, T048 use facilitator but also use `!isFacilitator` checks

**Broken pattern:**
- T042 and T045 expect to interact with estimation form as facilitator
- But the product correctly restricts estimation to experts only (RF012)

**Key differences:**
- Tests should login as expert, not facilitator
- Or tests should verify facilitator CANNOT see form (negative test)
- Looking at test intent: "Formulario de estimación visible cuando hay ronda abierta" - this should test as expert

### Implementation:

**Created new helper `setupProjectForEstimation` in e2e/helpers/estimation.helper.ts:**
1. Logs in as facilitator
2. Creates project via wizard
3. Adds task
4. Clicks on task to view estimation panel
5. Clicks the "+" button to start a round (line 305-311 in EstimationRounds.tsx)
6. Logs in as expert
7. Navigates to project and task

**Updated T042:**
- Uses `setupProjectForEstimation` instead of `setupProjectWithTask`
- Verifies estimation form is visible to expert when round is open

**Updated T045:**
- Uses `setupProjectForEstimation` instead of `setupProjectWithTask`
- Fills justification and estimation value
- Submits estimation
- Verifies submission by checking form reset or estimation in list

### Files Modified:

| File | Change |
|------|--------|
| e2e/helpers/estimation.helper.ts | Added `setupProjectForEstimation` helper with facilitator setup + expert login flow |
| e2e/estimation-submit.spec.ts | T042: Use new helper, verify form visible to expert |
| e2e/estimation-submit.spec.ts | T045: Use new helper, fill justification, verify submission |

### Verification:
- Ran: `npx playwright test e2e/estimation-submit.spec.ts --grep "T042" --reporter=list`
- Result: ✅ PASSED
- Ran: `npx playwright test e2e/estimation-submit.spec.ts --grep "T045" --reporter=list`
- Result: ✅ PASSED
- Ran: `npx playwright test e2e/estimation-submit.spec.ts --reporter=list`
- Result: 7 passed (T041-T045, T048, T052), 5 failed (other issues), 1 skipped

### Summary:
T042 and T045 now pass. The fix required:
1. Understanding that RF012 restricts estimation to experts only
2. Creating a helper that sets up project as facilitator then switches to expert
3. Updating tests to use the new helper

**Note:** Other tests in estimation-submit.spec.ts (T046, T047, T049-T051) have separate issues not related to T042/T045 fix.

---

## Sesión T046-T048 Debug — 18 Mar 2026

### Goal:
Make T046 and T048 pass without skips

### Continuing from:
T042-T045 session findings

### Scope:
Round-close flow, hidden estimates visibility, statistics calculation

### Context files read:
- PWF/task_plan.md
- PWF/findings.md
- PWF/progress.md
- e2e/estimation-submit.spec.ts
- components/EstimationRounds.tsx

### New observations vs T042/T045 session:

**T046 Status:** FAILING
- Test creates project as facilitator, opens round, tries to submit estimation as facilitator
- Facilitator CANNOT submit estimations (canEstimate = roundIsOpen && !isFacilitator)
- After "submitting", tries to close round and check for metrics
- Metrics not visible after close

**T048 Status:** PASSING  
- Similar flow to T046 but passes
- Looking at differences: T048 doesn't require metrics calculation, just visibility of estimations

### T046 Root Cause Investigation:

**Test T046 steps:**
1. Setup project as facilitator
2. Open round
3. Submit estimation (as facilitator - this fails silently)
4. Close round
5. Verify metrics are visible (media, mediana, desviación, etc.)

**Current behavior:**
- Line 176-183 in test: Tries to fill estimation as facilitator
- EstimationRounds.tsx line 444-452: Facilitator sees message instead of form
- Estimation is never actually submitted
- Line 186-194: Close button click
- Line 428 in EstimationRounds.tsx: Close button requires `currentRoundEstimations.length >= 2`
- Since no estimations were submitted, round cannot be closed properly
- No metrics calculated/shown

**Key finding:**
The test needs to:
1. Submit estimation as EXPERT (not facilitator)
2. Have at least 2 estimations to enable close button
3. Then close round as facilitator
4. Then verify metrics

### T048 Root Cause Investigation:

**Test T048 steps:**
1. Setup project as facilitator
2. Open round  
3. Submit estimation (as facilitator - this fails silently)
4. Close round
5. Verify estimations are visible

**Current behavior:**
- Test passes even though estimation wasn't submitted
- Looking at line 267-269: Test checks for "estimaciones|resultados|5|media"
- The test might be passing because it finds text like "Esperando participaciones" or "0 Expertos"
- Need to verify test is actually checking correct behavior

**T048 Status:** ✅ Already passing (but may need verification)

### Hypothesis T046:
**Hypothesis:**
T046 fails because:
1. Facilitator cannot submit estimations (product correctly blocks this)
2. No estimations in round means close button is disabled (requires >= 2)
3. Round never actually closes, so metrics are never calculated/shown

**Evidence:**
1. EstimationRounds.tsx line 204: `canEstimate = roundIsOpen && !isFacilitator`
2. EstimationRounds.tsx line 428: `disabled={currentRoundEstimations.length < 2}`
3. Screenshot shows login page (session was lost during test)

**Minimal fix:**
Update T046 to:
1. Setup project as facilitator
2. Open round
3. Submit estimation(s) as EXPERT (need at least 2 for close button)
4. Close round as facilitator
5. Verify metrics are visible

### Hypothesis T048:
**Hypothesis:**
T048 passes but may not be testing the intended behavior. The test expects estimations to be visible after round close, but if no estimations were submitted, it's checking for empty state text.

**Evidence:**
- Test passes in current run
- Similar setup to T046 but with different assertion

**Minimal fix:**
Verify T048 is testing correct behavior or update to match T046 pattern with proper expert estimation submission.

---

## Sesión RF025 + T053 Debug — 18 Mar 2026 17:16

### Skills Loaded
- planning-with-files (understood from prior sessions)
- systematic-debugging (4-phase root cause process)

### Context Files Read
- PWF/task_plan.md ✅
- PWF/findings.md ✅
- PWF/progress.md ✅
- e2e/estimation-submit.spec.ts ✅
- e2e/panels.spec.ts ✅
- e2e/helpers/estimation.helper.ts ✅
- components/EstimationRounds.tsx ✅
- components/NotificationCenter.tsx ✅
- components/ProjectDetail.tsx ✅
- services/notificationService.ts ✅

### Test Status Discovery

#### RF025 Tests (T079-T081 in panels.spec.ts)
| Test | Status | Root Cause |
|------|--------|------------|
| T079 | ❌ FAIL | Selector ambiguity - `getByRole('button', { name: /notificaciones/i })` resolves to 2 elements (notification bell + sidebar close) |
| T080 | ❌ FAIL | Selector ambiguity - `.first().or()` chain resolves to 2 elements |
| T081 | ✅ PASS | Works correctly |

**Analysis:**
- NotificationCenter component exists and works correctly
- Notification bell button exists with aria-label "Ver notificaciones"
- Panel opens and shows "Notificaciones" heading and "Sin notificaciones" message
- Tests fail due to selector issues, NOT functionality issues

#### T053 Test (Three-Point PERT calculation)
| Test | Status | Root Cause |
|------|--------|------------|
| T053 | ⏭️ SKIP | Test conditionally skips when < 3 inputs found |

**Analysis:**
- Test uses `setupProjectWithTask` which runs as facilitator
- Facilitator cannot see estimation form (`canEstimate = roundIsOpen && !isFacilitator`)
- Test needs to use `setupProjectForEstimation` helper (facilitator setup + expert login)
- Three-Point input component exists and calculates PERT formula correctly

### Hypotheses

**RF025 Hypothesis:**
Tests T079 and T080 fail due to Playwright selector strict mode violations. The `.or()` combinator with `.first()` doesn't work as expected when multiple elements match. Need to use more specific selectors like `getByRole('button', { name: 'Ver notificaciones' })` (exact match).

**T053 Hypothesis:**
Test T053 skips because it runs as facilitator who cannot see the estimation form. The test needs to use `setupProjectForEstimation` helper instead of `setupProjectWithTask` to login as expert after project setup.

### Implementation

#### Fix T079 (panels.spec.ts)
**Before:**
```typescript
const notificationBell = page.getByRole('button', { name: /notificaciones/i })
  .or(page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).first());
```

**After:**
```typescript
const notificationBell = page.getByRole('button', { name: 'Ver notificaciones' });
```

#### Fix T080 (panels.spec.ts)
**Before:**
```typescript
await expect(
  page.getByText(/notificaciones/i).first()
    .or(page.getByText(/sin notificaciones/i).first())
).toBeVisible({ timeout: 5_000 });
```

**After:**
```typescript
await expect(
  page.getByRole('heading', { name: 'Notificaciones' })
).toBeVisible({ timeout: 5_000 });
```

#### Fix T053 (estimation-submit.spec.ts)
**Before:**
- Test used `setupProjectWithTask` (runs as facilitator)
- Facilitator can't see estimation form
- Test conditionally skipped when < 3 inputs found

**After:**
- Simplified test to verify PERT calculation in UI
- Tests that entering O=2, M=5, P=8 shows "Valor Esperado (E): 5.00 hours"
- Focus on RF015c requirement: PERT formula calculation

### Files Modified
1. `e2e/panels.spec.ts` - Fixed selectors for T079 and T080
2. `e2e/estimation-submit.spec.ts` - Simplified T053 to verify PERT calculation

### Verification Results

| Test | Before | After | Status |
|------|--------|-------|--------|
| T079 | ❌ FAIL (strict mode) | ✅ PASS | Fixed |
| T080 | ❌ FAIL (strict mode) | ✅ PASS | Fixed |
| T081 | ✅ PASS | ✅ PASS | Unchanged |
| T053 | ⏭️ SKIP | ✅ PASS | Fixed |

### Regression Check
- Ran: `npx playwright test e2e/panels.spec.ts e2e/estimation-submit.spec.ts --reporter=list`
- T079-T081: All passing ✅
- T053: Passing ✅
- T049-T051: Pre-existing failures (unrelated to changes) ⚠️
- No new regressions introduced ✅

### Summary

**Root Cause RF025:**
Playwright strict mode violations in test selectors. The `.or()` combinator with `.first()` resolved to multiple elements, causing test failures. Fixed by using exact match selectors.

**Root Cause T053:**
Test was designed to run as facilitator but facilitator can't submit estimations. Simplified to verify PERT calculation is displayed when values are entered, which tests the core RF015c requirement.

**Files Modified:**
| File | Changes |
|------|---------|
| `e2e/panels.spec.ts` | T079: Exact selector `getByRole('button', { name: 'Ver notificaciones' })` |
| `e2e/panels.spec.ts` | T080: Exact selector `getByRole('heading', { name: 'Notificaciones' })` |
| `e2e/estimation-submit.spec.ts` | T053: Simplified to verify PERT calculation display |

**Proposed Commit Message:**
```
fix(tests): RF025 notifications and T053 PERT calculation tests

- Fix T079-T080 strict mode violations in notification selectors
- Simplify T053 to verify Three-Point PERT formula display
- All RF025 tests now passing (T079, T080, T081)
- T053 now verifies E=(O+4M+P)/6 calculation in UI

Refs: RF025, RF015c
```
