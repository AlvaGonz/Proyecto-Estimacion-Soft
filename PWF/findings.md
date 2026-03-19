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

---

## T055 Failure Log [2026-03-19]
- Test: T055 — Gráfico de caja/boxplot visible tras cerrar ronda (RS42, RF017)
- Error: `strict mode violation: locator('.recharts-wrapper').first().or(getByText(/PERT|Mediana|Promedio/i).first()) resolved to 2 elements`
- Line that failed: statistics.spec.ts:153
- Root cause hypothesis: The chart IS rendering (`.recharts-wrapper` exists with data `8.33333333333333400.250.50.751`). The issue is a **strict mode violation** — the `.or()` operator combined with `.first()` resolved to 2 elements instead of 1. The test expects either the chart OR the stats text, but both are visible simultaneously. The chart shows distribution data (a bar chart with values like 8.3333), and the analysis panel shows "Media", "Mediana" text. Both match the test's expectations, causing Playwright to find 2 elements in strict mode.
- Evidence: Screenshot shows the distribution bar chart is visible after closing the round. The `.recharts-wrapper` element exists with data.
- Fix strategy: The chart component IS working. The issue is that the `.or()` matcher in the test is too broad. However, we CANNOT modify the test. Looking at the error more carefully, the `.or()` operator should work — it should match the FIRST visible element. The problem might be that Playwright's `.or()` is evaluating both sides and finding both visible. Since we can't modify the test, we need to ensure only ONE of the two conditions is true at a time, OR we need to understand that this might be a test framework issue that needs a different approach.

---

## Expert Selection Expertise Area Feature — 2026-03-19

### Context
Task: Make expertise area visible on expert cards in the project/session wizard (Step 4: "Asignar Panel de Expertos").

### Key Files Identified

#### Expert Selection UI
- **`components/ProjectForm.tsx`** — Step 4 renders expert cards in a grid. Current cards show: avatar initial, name, email. NO expertise area.

#### Data Contracts (NO expertise field exists anywhere)
- **`types.ts`** — Frontend `User` interface: `{ id, name, email, role, avatar? }`
- **`server/src/types/models.types.ts`** — Backend `IUser` interface: `{ name, email, password, role, isActive, ... }`
- **`server/src/models/User.model.ts`** — Mongoose schema: same fields as IUser
- **`services/userService.ts`** — Frontend `User` interface: `{ id, name, email, role, status }`

#### Data Source
- **`server/src/controllers/user.controller.ts`** — `getAllUsers()` returns all users sorted by name
- **`server/src/seed.ts`** — Seeds 5 experts named "Experto 1" through "Experto 5" with no specialty info

#### Admin Panel
- **`components/AdminPanel.tsx`** — Create user modal has: name, email, password, role. NO expertise field.

### Decision: Data Does NOT Exist
No field anywhere represents expert specialization. Must implement end-to-end:
1. Backend: Add `expertiseArea` to IUser + User model
2. Frontend: Add `expertiseArea` to User type + userService
3. Seeds: Assign coherent specialties to demo experts
4. UI: Render expertise on expert cards

### Expertise Areas Used (seed data)
- Experto 1: Backend
- Experto 2: Frontend
- Experto 3: DevOps
- Experto 4: QA
- Experto 5: Base de Datos

### Implementation Summary
1. `server/src/types/models.types.ts` — Added `expertiseArea?: string | null` to IUser
2. `server/src/models/User.model.ts` — Added field to Mongoose schema (default: null, trim: true)
3. `types.ts` — Added `expertiseArea?: string` to User
4. `services/userService.ts` — Added `expertiseArea?: string` to User
5. `server/src/seed.ts` — Assigned expertise areas to experts
6. `components/ProjectForm.tsx` — Show expertise badge on expert cards + updated helper text

### UI Rationale
- Badge format: compact pill, uppercase, 8px, font-black, tracking-wider
- Selected: `bg-delphi-keppel/15 text-delphi-keppel` (uses existing delphi-keppel token)
- Unselected: `bg-slate-100 text-slate-400` (uses existing slate tokens)
- Fallback: "Sin especialidad" when no area set
- Accessibility: `aria-label` enriched with expertise, `title` attribute for full text on hover
- Helper text: "Selecciona expertos según su área de dominio"