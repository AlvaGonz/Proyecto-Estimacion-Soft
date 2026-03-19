

## Sesión T049-T051 Debug — 18 Mar 2026 17:30

### Skills Loaded
- planning-with-files (understood from prior sessions)
- systematic-debugging (4-phase root cause process)

### Context Files Read
- PWF/task_plan.md ✅
- PWF/findings.md ✅
- PWF/progress.md ✅
- e2e/estimation-submit.spec.ts ✅ (T049-T051 analyzed)
- components/EstimationRounds.tsx ✅ (renderEstimationInput switch)
- components/estimation-methods/*.tsx ✅ (all 3 methods exist)
- types.ts ✅ (EstimationMethod type defined)
- test-results/error-context.md ✅ (facilitator view shows no estimation form)

### Test Status Discovery

| Test | Status | Root Cause |
|------|--------|------------|
| T049 | ❌ FAIL | Facilitator logged in, round not opened, estimation form hidden |
| T050 | ❌ FAIL | Facilitator logged in, round not opened, PokerCards not visible |
| T051 | ❌ FAIL | Facilitator logged in, round not opened, ThreePointInput not visible |

**Analysis:**
- Tests use `setupProjectWithTask` which logs in as **facilitator**
- EstimationRounds.tsx line 204: `canEstimate = roundIsOpen && !isFacilitator`
- Facilitators CANNOT see estimation form (by design - RF012)
- Tests need to either:
  1. Use `setupProjectForEstimation` (switches to expert), OR
  2. Use a different approach to verify the UI components exist

**Current Error Context shows:**
- User: Adrian Alvarez (facilitador)
- Status: "Cierra la ronda para el análisis" (no active round)
- Missing: Round open → estimation form not rendered

### Key Findings

1. **Estimation method components exist:**
   - `DelphiInput.tsx` - Single number input ✅
   - `PokerCards.tsx` - Fibonacci card deck ✅
   - `ThreePointInput.tsx` - O/M/P inputs ✅

2. **EstimationRounds has method switch:**
   ```tsx
   switch (estimationMethod) {
     case 'wideband-delphi': return <DelphiInput ... />
     case 'planning-poker': return <PokerCards ... />
     case 'three-point': return <ThreePointInput ... />
   }
   ```

3. **Problem:** Tests verify form is visible but:
   - Facilitator can't see form (correct behavior)
   - Round needs to be opened first
   - Need expert role to see estimation UI

### Hypothesis

**T049/T050/T051 Hypothesis:**
Tests fail because they run as facilitator who cannot see the estimation form. The tests need to:
1. Open a round first (currently missing)
2. Either switch to expert role OR modify test to verify form exists in a different way

Since T049-T051 test that the **correct UI is shown for each method** (not the expert estimation flow), we should:
- Open the round as facilitator
- Keep facilitator view but verify the form component renders (change `canEstimate` logic or test approach)
- OR switch to expert view to verify the correct method UI

**Decision:** Use `setupProjectForEstimation` helper which:
1. Creates project as facilitator
2. Opens round as facilitator  
3. Switches to expert
4. Expert can see and interact with estimation form

This matches the pattern used for T042-T045.

### Implementation

Updated T049, T050, T051 to use `setupProjectForEstimation` instead of `setupProjectWithTask`:

**T049:**
```typescript
// BEFORE:
await setupProjectWithTask(page, projectName, 'Wideband Delphi');
// ... open round manually ...

// AFTER:
await setupProjectForEstimation(page, projectName, 'Wideband Delphi');
// Round already opened, expert logged in
```

**T050:**
```typescript
// BEFORE:
await setupProjectWithTask(page, projectName, 'Planning Poker');

// AFTER:
await setupProjectForEstimation(page, projectName, 'Planning Poker');
// Fixed strict mode: { name: '1', exact: true }
```

**T051:**
```typescript
// BEFORE:
await setupProjectWithTask(page, projectName, 'Estimación Tres Puntos');

// AFTER:
await setupProjectForEstimation(page, projectName, 'Estimación Tres Puntos');
```

### Additional Fix - T050 Strict Mode
T050 had an additional issue: `getByRole('button', { name: '1' })` matched "1", "13", and "21".
Fix: Added `exact: true` to match only the "1" button.

### Verification Results

| Test | Before | After |
|------|--------|-------|
| T049 | ❌ FAIL | ✅ PASS |
| T050 | ❌ FAIL | ✅ PASS |
| T051 | ❌ FAIL | ✅ PASS |

**Full Suite:**
- Ran: `npx playwright test e2e/estimation-submit.spec.ts --reporter=line`
- Result: **13 passed** (T041-T053 all passing)
- No regressions introduced ✅

### Files Modified

| File | Changes |
|------|---------|
| `e2e/estimation-submit.spec.ts` | T049: Use `setupProjectForEstimation` |
| `e2e/estimation-submit.spec.ts` | T050: Use `setupProjectForEstimation` + `{ exact: true }` fix |
| `e2e/estimation-submit.spec.ts` | T051: Use `setupProjectForEstimation` |

### Root Causes Summary

**T049:** Test used `setupProjectWithTask` (facilitator) who can't see estimation form. Fixed by using `setupProjectForEstimation` which switches to expert.

**T050:** Same root cause as T049 + strict mode violation on Poker card selector. Fixed both issues.

**T051:** Same root cause as T049. Fixed by using expert view.

## Sesión T054-T057 Debug — 18 Mar 2026 18:30

### Phase 1: Root Cause Investigation (Complete)

**T054-T061 Test Failure Analysis:**

The tests fail at the setup phase with "Cerrar y Analizar Ronda" button disabled, showing "0 Expertos".

**Root Cause Identified:**
The expert user defined in `auth.helper.ts` (`USERS.expert` = `e2e.expert1@uce.edu.do`) logs in as a DIFFERENT user than the "E2E Experto 1" that's assigned to the project during `createProjectViaWizard`.

**Evidence:**
1. `auth.helper.ts` line 5: `expert: { email: 'e2e.expert1@uce.edu.do', ... }`
2. `project.helper.ts` line 62: Clicks on "E2E Experto 1" by name
3. `project.service.ts` line 27: Experts only see projects where `expertIds` contains their user ID
4. If the email doesn't match the "E2E Experto 1" user's email, the estimation is saved with wrong `expertId`

**Verification Steps Needed:**
1. Check if `e2e.expert1@uce.edu.do` IS the email for "E2E Experto 1" user in database
2. If not, either:
   - Fix the auth helper to use correct email, OR
   - Ensure E2E setup creates the expert with matching email

**Root Cause CONFIRMED:**

The `loadRounds` function in `EstimationRounds.tsx` (lines 72-100) only runs when `projectId` or `taskId` changes:
```typescript
useEffect(() => {
  const loadRounds = async () => { ... };
  loadRounds();
  return () => { isMounted = false; };
}, [projectId, taskId]);  // Only re-runs when these change
```

When:
1. Expert submits estimation → local state updates for expert
2. Facilitator logs in → `projectId` and `taskId` are the SAME
3. `loadRounds` does NOT re-run → facilitator sees stale data (0 estimations)

**Fix Required:**
Add polling or refresh mechanism when viewing an active round. The component should periodically re-fetch estimations, or the page should refresh data when window regains focus.

**Short-term fix for tests:** Add `page.reload()` after facilitator login to force fresh data fetch.

**Long-term fix:** Add polling or socket.io for real-time updates.

**Implementation Required (from LDR specs):**

**For T054 (RF015b - Poker Stats):**
- Extend Estimation model or create Poker-specific estimation storage
- Implement `PlanningPokerMethod.calculate()` returning moda, frecuencia, consensoPct
- Store result in `metricajson` during round close

**For T055 (RF015c - ThreePoint Stats):**
- Extend Estimation model to store valoro, valorm, valorp
- Implement `ThreePointMethod.calculate()` returning E_mean, E_stdDev, sigma_mean, confidenceRange68/95
- Store result in `metricajson` during round close

**For T056 (RF033 - Method in Report):**
- Find or create report/summary component
- Add method name display with human-readable mapping
- Add method params display
- Add method-specific metrics display

**For T057 (RF034 - Method Lock):**
- Add guard in projectController.ts update handler
- Add middleware checking round count before allowing metodoestimacion changes
- Add frontend disabled state on method selector when rounds exist

## Sesión T054-T057 Debug — 18 Mar 2026 18:30

### Skills Loaded
- planning-with-files (understood from prior sessions)
- systematic-debugging (4-phase root cause process)

### Context Files Read
- PWF/task_plan.md ✅
- PWF/findings.md ✅
- PWF/progress.md ✅
- e2e/statistics.spec.ts ✅ (T054-T057 analyzed)
- server/src/services/round.service.ts ✅ (round close flow)
- server/src/controllers/round.controller.ts ✅ (close handler)
- server/src/models/Estimation.model.ts ✅ (single value field only)
- test-results/error-context.md ✅ (shows 0 expertos - data sync issue)

### Test Status Discovery

| Test | Status | Root Cause Hypothesis |
|------|--------|----------------------|
| T054 | ❌ FAIL | Missing Poker method stats (moda, frecuencia, consensoPct) in metricajson |
| T055 | ❌ FAIL | Missing ThreePoint method stats (E_mean, confidence ranges) in metricajson |
| T056 | ❌ FAIL | Report component doesn't show method name, params, method-specific metrics |
| T057 | ❌ FAIL | No RF034 guard in project update - method can be changed after rounds exist |

**Analysis T054-T055:**
- Current `Estimation` model only stores: `roundId`, `taskId`, `expertId`, `value`, `justification`
- No storage for: `valoro`, `valorm`, `valorp` (ThreePoint), `cardValue` (Poker)
- `statisticsService.calculateMetrics()` only computes generic stats (mean, median, stdDev, CV)
- No method-specific Strategy pattern implemented for Poker/ThreePoint

**Analysis T056:**
- No report component or API endpoint found that returns method-specific data
- Need to check if there's a project summary/report view

**Analysis T057:**
- `projectController.ts` update handler has no check for `metodoestimacion` changes when rounds exist
- No middleware guarding against method changes after first round

### Key Findings

1. **Missing Strategy Pattern for Methods:**
   - No `PlanningPokerMethod.ts` strategy file found
   - No `ThreePointMethod.ts` strategy file found
   - No `DelphiMethod.ts` strategy file found
   - The round close uses generic `statisticsService.calculateMetrics()` only

2. **Estimation Model Limitations:**
   - Only supports single `value` field
   - Cannot store ThreePoint O/M/P values
   - Cannot store Poker card selection

3. **Test Infrastructure Issue:**
   - The test shows "0 Expertos" after expert submission
   - This indicates the estimation isn't being properly saved or synced
   - May need to investigate the estimation submission flow

### Implementation Required

**For T054 (RF015b - Poker Stats):**
- Extend Estimation model or create Poker-specific estimation storage
- Implement `PlanningPokerMethod.calculate()` returning moda, frecuencia, consensoPct
- Store result in `metricajson` during round close

**For T055 (RF015c - ThreePoint Stats):**
- Extend Estimation model to store valoro, valorm, valorp
- Implement `ThreePointMethod.calculate()` returning E_mean, E_stdDev, sigma_mean, confidenceRange68/95
- Store result in `metricajson` during round close

**For T056 (RF033 - Method in Report):**
- Find or create report/summary component
- Add method name display with human-readable mapping
- Add method params display
- Add method-specific metrics display

**For T057 (RF034 - Method Lock):**
- Add guard in projectController.ts update handler
- Add middleware checking round count before allowing metodoestimacion changes
- Add frontend disabled state on method selector when rounds exist

### Proposed Commit Message
```
fix(tests): T049-T051 multi-method estimation UI tests

- Update T049, T050, T051 to use setupProjectForEstimation helper
- Helper creates project, opens round, and switches to expert
- Fix T050 strict mode violation with exact: true on card selector
- All RF032 method UI tests now passing:
  * T049: Wideband Delphi numeric input
  * T050: Planning Poker Fibonacci cards
  * T051: Three-Point O/M/P fields


Refs: RF031, RF032
```

## Sesión T054-T057 Investigation — 18 Mar 2026 20:15

### Skills Loaded
- planning-with-files ✅
- systematic-debugging (Investigation Phase) ✅

### Context Files Read
- server/src/services/statistics.service.ts ✅ (Only basic metrics)
- server/src/services/round.service.ts ✅ (Generic close logic)
- server/src/models/Round.model.ts ✅ (Missing metricajson)
- server/src/models/Estimation.model.ts ✅ (Missing O/M/P fields)
- components/EstimationRounds.tsx ✅ (Refreshes data on visibility change)

### Root Cause Analysis (T054-T057 Failures)

| Test | Requirement | Status | Root Cause |
|------|-------------|--------|------------|
| T054 | RF015b (Poker Stats) | ❌ FAIL | `PlanningPokerMethod.calculate()` missing from backend. `RoundResults` doesn't show `moda`/`frecuencia`. |
| T055 | RF015c (PERT Stats) | ❌ FAIL | `ThreePointMethod.calculate()` missing. `Estimation` model doesn't store expert O/M/P values. |
| T056 | RF033 (Method in Report) | ❌ FAIL | `ReportGenerator.tsx` and API don't display method meta-data. `METHOD_LABELS` not shared. |
| T057 | RF034 (Method Lock) | ❌ FAIL | Missing backend guard in `project.controller.ts`. Frontend selector not disabled when rounds > 0. |

### Proposed Plan

1. **Back-end Refactor**:
   - Create `server/src/strategies/` for polymorphic estimation methods.
   - Implement `IBaseEstimationMethod` interface.
   - Extend `Round` model with `metricaResultados: Object`.
   - Extend `Estimation` model with `metodoData: Object`.
   - Update `roundService.close` to use the strategy.

2. **Front-end Refactor**:
   - Update `EstimationRounds.tsx` to handle method-specific results table.
   - Share `METHOD_LABELS` in a common constants file.
   - Update `ReportGenerator.tsx` to show method name and configuration.
   - Disable method selection in `ProjectForm.tsx` if rounds exist.

3. **Data Sync Fix**: 
   - Add `page.reload()` to failing tests T054-T057 to ensure facilitator sees expert submissions.

4. **Verify**:
   - Run tests and ensure 100% compliance with RF015b, RF015c, RF033, RF034.
