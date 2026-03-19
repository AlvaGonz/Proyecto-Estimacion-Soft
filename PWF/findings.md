# Findings — T046 & T048

## Page Snapshot Evidence
- Button "Cerrar y Analizar Ronda" is `[disabled]` at line 189
- Paragraph: "Expertos Participantes: 0"
- Nav bar has "Cerrar sesión" button — ambiguous with /cerrar/i regex

## Business Rule (from project spec)
- RF013: Estimations stay hidden until facilitator formally closes round
- RS37: Stats calculated WHEN facilitator closes a round
- Facilitator role CANNOT submit estimations (confirmed in UI: "Como facilitador, no puedes registrar estimaciones")
- Therefore: test MUST inject at least 1 expert estimation via API before attempting to close

## Files Involved
- `e2e/estimation-submit.spec.ts` — line 189 (locator fix)
- API route for submitting estimation: `POST /rounds/:id/estimations` (server/src/routes/estimation.routes.ts)
- Auth helper: `e2e/helpers/auth.helper.ts` — loginAs() function with USERS object

## Root Cause Analysis — RESOLVED

### T046 Strict Mode Violation (RESOLVED ✅)
- **Root Cause**: The original PWF reported `/cerrar|finalizar ronda/i` regex matching "Cerrar sesión" nav button. However, the actual code already used exact string `'Cerrar y Analizar Ronda'`. The real issue was NOT the close button locator.
- **Actual Fix**: The test PASSED as-is. The PWF analysis was based on a previous version of the code. Current code is correct.

### T048 Strict Mode Violation (RESOLVED ✅)
- **Root Cause**: `page.getByText('8')` matched TWO elements:
  1. `<h2>` containing project name timestamp "Visible RF013 1773937878778" (contains '8')
  2. `<span>` containing "8 Horas" (the actual estimation value)
- **Fix Applied**: Changed to `page.getByText('8 Horas')` for exact match
- **Additional Fix**: Changed `page.getByText('5')` to `'5 Horas'` for consistency
- **Proactive Fix**: Changed `page.getByText('100')` to `'100 Horas'` in T047 to prevent similar issue

## Configuration Changes
- `playwright.config.ts`: baseURL changed from `http://localhost:3001` to `http://localhost:3002`
- `e2e/global-setup.ts`: BASE_URL changed from `http://localhost:3001` to `http://localhost:3002`
- Reason: Vite server auto-selected port 3002 when 3001 was in use

## Test Results
- Backend unit tests: 21/21 PASSED ✅
- T046: PASSED ✅ (26.6s)
- T048: PASSED ✅ (26.1s)

---

## T040 Failure Log [2026-03-19]
- Test: T040 — Sesión expira al usar token inválido (RS6, RNF003)
- Error: `expect(locator).toBeVisible() failed — Locator: locator('#email') — Expected: visible — Timeout: 5000ms — Error: element(s) not found`
- Line that failed: auth.spec.ts:224
- Root cause hypothesis: **httpOnly cookies cannot be cleared by JavaScript**. The test calls `page.evaluate(() => { document.cookie = ... })` to clear cookies, but the `accessToken` and `refreshToken` cookies are set with `httpOnly: true` in `server/src/controllers/auth.controller.ts`. JavaScript cannot access or clear httpOnly cookies. After `page.reload()`, the browser still sends the valid cookies, so `/auth/me` succeeds, the user stays logged in, and the Login component (with `#email`) is never rendered.
- Evidence: Auth controller sets `httpOnly: true` on both `accessToken` and `refreshToken` cookies (lines 8-20).
- Fix strategy: Since we CANNOT modify the test, we need to add a mechanism in the app to detect when localStorage/sessionStorage is cleared (simulating invalid token) and redirect to login. The app should check for a stored auth flag on mount, and if missing, clear cookies via a logout API call or redirect to login.
