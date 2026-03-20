# Findings — EstimaPro Session 2026-03-20

## Root Causes Identified

### 1. FLICKERING (lines 87-136, 139-166 EstimationRounds.tsx)
**Cause A:** `setInterval` every 15s calls `loadRounds()` which does `setIsLoading(true)` → 
entire component unmounts/remounts showing spinner → **visual flicker**.
**Cause B:** `visibilitychange` listener ALSO triggers full `setEstimations([...allEsts.flat()])` 
which causes re-render even when data hasn't changed.
**Cause C:** App.tsx lines 110-128: `import('./services/notificationService')` inside `useEffect` 
is a dynamic import — in dev mode this re-evaluates on every render cycle triggered by HMR.
**Fix:** Remove `setIsLoading(true)` from poll/refresh paths (only use it for initial load).
Remove `setInterval` or only poll when `activeRound` exists AND only update state when data 
actually differs. Remove `visibilitychange` handler (or make it quiet). Convert App.tsx 
notification import to static import.

### 2. NOTIFICATIONS NOT WORKING
**Cause:** All calls to `notificationService` inside `EstimationRounds.tsx` use 
`import('../services/notificationService').then(...)` — this is a dynamic async import.
In some environments/builds this module resolution fails silently (no catch, or the `.catch` 
is on the outer promise not the inner one). 
`handleSendReminder` has `.catch(console.error)` on the `projectService.getProject` promise
but the inner `import(...).then(...)` has no error handler at all.
**Fix:** Add static import of `notificationService` at the top of `EstimationRounds.tsx`.
Remove all the `import(...).then(...)` wrappers.

### 3. RESULTS VISIBLE FROM FIRST ESTIMATION
**Current:** The estimation list (lines 626-688) already shows estimations when present.
BUT: The `currentRoundEstimationsWithLabels` uses `convergenceService.addAnonymousLabels` which
requires the round to be closed to unmask values IF the server hides them.
**Fix needed for facilitator view:** Show a "live" tally section below the main grid as soon as
`estimations.filter(e => e.roundId === activeRoundId).length > 0`. This section appears inline
(not a modal) showing a count badge and the list BUT masks individual values for experts 
(they only see "X expertos han estimado" not the actual values) — facilitator sees all.

### 4. DOUBLE CONFIRMATION ON CLOSE ROUND
**Current:** `handleCloseRound` at line 287 closes immediately.
**Fix:** Add `showCloseConfirmModal` state. Check if 
`missingCount = totalExperts - currentRoundEstimations.length > 0`.
If yes → show confirm modal with warning. If no (all submitted) → close directly.

## Files to Modify
- `components/EstimationRounds.tsx` — main changes (all 4 fixes)
- `App.tsx` — static import fix for notification service