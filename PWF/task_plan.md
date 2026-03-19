# Task Plan — T046 & T048 Fix
Status: in_progress
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

## Phase 3: Fix Locator — [pending]
## Phase 4: Add Expert Estimation Setup — [pending]
## Phase 5: Verify T046 & T048 Pass — [pending]
