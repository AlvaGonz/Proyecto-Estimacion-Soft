# Architecture Rules

## 3-Tier Boundary (HARD — never cross)
- **Frontend** layer must never import from `server/` and must never contain business logic beyond UI state.
  - verify: `grep -r "from.*server/" src/` must return 0 matches.
- **Backend** layer must never import from `src/` (frontend). All business logic lives in `server/src/modules/`.
  - verify: `grep -r "from.*src/" server/` must return 0 matches pointing to frontend files.
- **Database** layer is accessed exclusively via Mongoose models inside `server/src/modules/<domain>/`. No raw MongoDB driver calls outside model files.
  - verify: `grep -r "MongoClient" server/src/modules/` must return 0 matches.

## Frontend Architecture (Feature-Based — non-negotiable)
- All feature code must live under `src/features/<domain>/` (components, hooks, service calls for that domain).
- Shared UI-only components (no business logic) go in `src/components/`.
- Never bypass the feature service layer and call API routes directly from components.
  - Example of WRONG: `fetch('/api/projects')` inside `ProjectCard.tsx`.
  - Example of CORRECT: `projectService.getAll()` imported from `src/features/projects/projectService.ts`.
  - verify: `grep -r "fetch(" src/features/` must return 0 matches that are not in `*Service.ts` files.

## Backend Architecture (Domain-Module — non-negotiable)
- Every domain must own its own: controller, service, routes, validators, and model — all under `server/src/modules/<domain>/`.
- No cross-domain imports except through explicitly defined shared services in `server/src/shared/`.
  - verify: `grep -r "from.*modules/" server/src/shared/` must return 0 matches (shared must not depend on domains).

## Import Paths
- Must use absolute alias paths (`@/...`) for all internal imports. Never use `../../..` relative paths deeper than 2 levels.
  - verify: `grep -rE "from '\.\./\.\./\.\." src/` must return 0 matches.

## Business Logic Placement
- Complex calculations (statistics, convergence, outlier detection) must live in backend services, never in React components.
  - verify: No `mean(`, `stdDev(`, `IQR(` calls found inside `src/features/` component files.
