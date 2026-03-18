

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
