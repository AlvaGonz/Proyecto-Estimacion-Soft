# Task Plan — T046 & T048 Fix
Status: complete ✅
Date: 2026-03-19

## Phase 1: Context Load — [complete]
- Read PWF/ and test-results/ folders

## Phase 2: Root Cause Confirmed — [complete]
### Bug 1 — Strict Mode Violation (Line 189, estimation-submit.spec.ts)
- Cause: `/cerrar|finalizar ronda/i` matches "Cerrar sesión" (nav logout) + "Cerrar y Analizar Ronda" (panel)
- Fix: Replace regex with exact string `'Cerrar y Analizar Ronda'`

### Bug 2 — Button Disabled / Missing Test Precondition
- Cause: Button is correctly disabled when 0 expert estimations exist (RF013)
- Fix: Add API-based expert estimation setup BEFORE facilitator closes round

## Phase 3: Fix Locator — [complete]
- T048: Changed `page.getByText('8')` → `'8 Horas'` (strict mode violation from timestamp)
- T048: Changed `page.getByText('5')` → `'5 Horas'` (consistency)
- T047: Changed `page.getByText('100')` → `'100 Horas'` (proactive fix)

## Phase 4: Add Expert Estimation Setup — [complete]
- T048 already had correct expert estimation flow (experts submit before facilitator closes)
- No additional API injection needed — test flow was correct

## Phase 5: Verify T046 & T048 Pass — [complete]
- Backend unit tests: 21/21 PASSED ✅
- T046: PASSED ✅ (26.6s)
- T048: PASSED ✅ (26.1s)

## Configuration Changes
- `playwright.config.ts`: baseURL → `http://localhost:3002`
- `e2e/global-setup.ts`: BASE_URL → `http://localhost:3002`
