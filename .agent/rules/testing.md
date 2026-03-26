# Testing Rules

## Frontend Testing (Vitest + React Testing Library)
- Coverage must be maintained at ≥ 80% (current: 96.66%). Never merge a PR that drops coverage below 80%.
  - verify: `npx vitest run --coverage` exits 0 and coverage summary shows ≥ 80% on all metrics.
- Test files must be colocated alongside their source file (e.g., `MyComponent.test.tsx` next to `MyComponent.tsx`).
- Never write tests that test implementation details (e.g., internal state). Only test observable behavior (rendered output, user events, API calls).

## Backend Testing (Vitest — same runner as frontend)
- All new backend controller, service, and utility functions must have unit tests.
  - verify: `cd server && npx vitest run` exits 0 before any PR.
- Database layer must be tested with `mongodb-memory-server` — never against the real database.
  - verify: No test file contains a real `MONGO_URI` connection string.
- Auth middleware must be mocked in all non-auth unit tests.

## End-to-End Testing (Playwright)
- All interactive user flows must have a corresponding Playwright test in the `e2e/` folder.
  - verify: `npx playwright test` exits 0 on `develop` branch before merging features.
- E2E tests run only on PRs targeting `develop` or `main` (not on every push) to avoid CI cost.

## TDD Requirement (RED → GREEN → REFACTOR — non-negotiable)
- For any new feature or bug fix: write a failing test first. Do not write implementation code until the test fails.
  - verify: The first test run after writing a test (before writing the fix) must produce ≥ 1 FAIL result. Screenshot or log the FAIL output as evidence.
- Refactor only after GREEN — never refactor a failing test to make it pass.

## Test Locations
- Frontend unit tests: colocated (`Component.test.tsx`) or in `src/__tests__/`.
- Backend unit tests: inside `server/src/modules/<domain>/__tests__/` or colocated.
- E2E tests: `e2e/` root folder only.
  - verify: `find e2e/ -name "*.spec.ts" | wc -l` must return ≥ 1 before any feature is marked done.

## Coverage Gaps (Mandatory Tracking)
- Backend coverage below 30% for any domain must be logged as a gap in `tasks/test-backlog.md`.
  - verify: After every test run, check `coverage/` report — domains < 30% coverage must appear in `tasks/test-backlog.md`.
