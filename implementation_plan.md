# Implementation Plan — E2E Playwright Coverage for EstimaPro

## [Overview]

Audit and fix all E2E Playwright tests to achieve 100% passing coverage for all RF001-RF034 and RNF001-RNF008 use cases, starting with functionality verification, then test correctness, then bug fixes.

The EstimaPro project has 14 e2e test files with ~80+ tests covering authentication, project management, estimation rounds, statistics, discussion, panels, documentation, reports, and dashboard. However, 2 critical bugs exist in estimation-submit.spec.ts (T046 strict mode violation, T048 missing expert estimation setup), and the full test suite needs auditing for correctness across all 9 phases. This plan addresses functionality gaps first, then test fixes, then final verification.

## [Types]

No new type definitions are required — all types exist in types.ts and server/src/types/models.types.ts. Existing types cover EstimationMethod, Round, Estimation, ConvergenceConfig, ThreePointEstimation, and FibonacciCard.

## [Files]

### Files to Modify
- e2e/estimation-submit.spec.ts — Fix T046 locator (line 189: ambiguous /cerrar|finalizar ronda/i matching "Cerrar sesion"), fix T048 to inject expert estimation before facilitator closes round
- e2e/helpers/estimation.helper.ts — Verify setupProjectWithRoundClose properly injects expert estimation via API before facilitator closes round
- PWF/task_plan.md — Update with final status
- PWF/progress.md — Append final status
- PWF/findings.md — Append all discoveries and edge cases

### Files to Audit (Read-Only Verification)
- e2e/auth.spec.ts — T028-T040: Verify registration, login, roles, permissions
- e2e/projects.spec.ts — T010-T019: Verify wizard, creation, management
- e2e/estimation-rounds.spec.ts — T020-T027: Verify rounds, tasks
- e2e/statistics.spec.ts — T054-T061: Verify charts, convergence
- e2e/discussion.spec.ts — T062-T065: Verify discussion space
- e2e/panels.spec.ts — T066-T072, T079-T081: Verify panels, notifications
- e2e/documentation.spec.ts — T073-T075: Verify document management
- e2e/reports.spec.ts — T076-T078: Verify reports, audit
- e2e/dashboard.spec.ts — T030-T041: Verify dashboard metrics
- e2e/three-point.spec.ts — T040-T045: Verify Three-Point method
- e2e/estimapro-flow.spec.ts — T001-T007: Verify auth flow, navigation
- e2e/global-setup.ts — Verify login UI flow, expert creation

## [Functions]

### Bug Fix: T046 Strict Mode Violation
- File: e2e/estimation-submit.spec.ts line 189
- Current: const closeBtn = page.getByRole('button', { name: /cerrar|finalizar ronda/i }) — ambiguous, matches "Cerrar sesion" nav button
- Fix: Replace with exact string page.getByRole('button', { name: 'Cerrar y Analizar Ronda' })

### Bug Fix: T048 Missing Expert Estimation
- File: e2e/estimation-submit.spec.ts T048 test
- Current: Facilitator attempts to close round when 0 expert estimations exist — button disabled
- Fix: Add API-based expert estimation submission BEFORE facilitator closes round
- Helper Update: e2e/helpers/estimation.helper.ts setupProjectWithRoundClose must ensure at least 1 expert estimation exists

### Functionality Verification Checklist
- Auth Routes: POST /auth/register, POST /auth/login — verify JWT generation, bcrypt hashing
- RBAC Middleware: Verify requireRole intercepts all protected routes
- Estimation Routes: POST /rounds/:id/estimations — verify expert-only access, unique estimation per round
- Round Routes: POST /projects/:id/rounds, POST /rounds/:id/close — verify facilitator-only access
- Statistics Service: Verify calculateMetrics returns correct mean, median, stdDev, variance, CV, IQR, outliers
- Convergence Service: Verify evaluateConsensus returns correct convergence result
- Estimation Visibility: Verify estimations hidden during open round, revealed after close (RS32-RS34)

## [Classes]

No new classes required. Existing classes and services are sufficient:
- statisticsService — Backend statistical calculations
- convergenceService — Frontend convergence evaluation
- estimationService — Frontend estimation API calls
- roundService — Frontend round API calls

## [Dependencies]

No new dependencies required. Existing dependencies are sufficient:
- @playwright/test — E2E testing framework
- zod — Input validation
- recharts — Chart rendering (verified in EstimationRounds.tsx)

## [Testing]

### Test Execution Strategy
1. Run npx playwright test --grep "auth" — verify Phase 1
2. Run npx playwright test --grep "project" — verify Phase 2
3. Run npx playwright test --grep "estimation" — verify Phase 3
4. Run npx playwright test --grep "stats|convergence" — verify Phase 4
5. Run npx playwright test --grep "chart|distribution" — verify Phase 5
6. Run npx playwright test --grep "discussion" — verify Phase 6
7. Run npx playwright test --grep "dashboard|panel" — verify Phase 7
8. Run npx playwright test --grep "report" — verify Phase 8
9. Run npx playwright test — full suite final verification

### Expected Outcomes
- All tests pass at 100% after fixes
- No strict mode violations
- No missing preconditions
- All business rules validated (RF013: estimations hidden until round close, RF034: method immutable after first round, RNF008: estimates immutable after round close)

## [Implementation Order]

1. Phase 1: Functionality Verification — Verify all backend services, routes, and middleware work correctly. Run backend unit tests. Verify database seeding creates required users.
2. Phase 2: Test Audit — Run each test file individually, identify failures, categorize as: (a) strict mode violation, (b) missing precondition, (c) incorrect assertion, (d) timing issue.
3. Phase 3: Bug Fix — T046 — Fix ambiguous locator in estimation-submit.spec.ts line 189.
4. Phase 4: Bug Fix — T048 — Add expert estimation injection before facilitator closes round in T048 test.
5. Phase 5: Helper Updates — Update estimation.helper.ts to ensure expert estimations exist before round close.
6. Phase 6: Full Suite Verification — Run npx playwright test and verify 100% pass rate.
7. Phase 7: PWF Update — Update PWF/task_plan.md, PWF/progress.md, PWF/findings.md with final status.