# ADR-001: Stack Selection — React + Vite + Node.js + MongoDB

**Date:** 2026-03-27
**Status:** Accepted
**Deciders:** EstimaPro development team

***

## Context

The Plataforma de Estimación de Software (EstimaPro) requires a full-stack
web application to support planning poker sessions, sprint estimations, and
export of estimation reports (RF001–RF050, Proyecto-Plataforma de Estimación v1).

Key requirements driving the decision:
- Real-time collaborative estimation sessions (planning poker — RF011–RF020)
- Role-based access control for Scrum Master and team members (RF001–RF010)
- Dashboard with estimation history and trend charts (RF041–RF050)
- PDF report export per sprint (RF028)
- Containerized deployment via Docker for local and CI environments

The team evaluated the following dimensions:
- Developer familiarity and hiring availability
- Type safety across the full stack
- Performance for interactive real-time UI
- Ecosystem maturity for the required feature set

***

## Decision

### Frontend: React 19 + Vite 6 + TypeScript + Tailwind CSS

**Rationale:**
- React 19 is the industry standard for component-driven UIs; team has existing
  proficiency, reducing onboarding time.
- Vite 6 provides sub-second HMR and a significantly faster DX than Create
  React App or Webpack for a TypeScript project of this scale.
- TypeScript enforces contract-first development between frontend and backend,
  catching integration bugs at compile time (critical for multi-role auth flows).
- Tailwind CSS enables consistent design implementation without a separate design
  system library, keeping the bundle lean for a V1 scope.

**Alternatives considered:**
| Alternative | Rejected reason |
|---|---|
| Next.js | SSR complexity unnecessary for a SPA with JWT auth; adds deployment overhead |
| Vue 3 | Team not proficient; lower job market availability for UCE context |
| Angular | Too opinionated for a small-team V1; steeper onboarding curve |

***

### Backend: Node.js + Express + TypeScript

**Rationale:**
- Shared TypeScript types between frontend and backend (monorepo pattern)
  eliminates a class of API contract bugs (field naming, enum mismatches).
- Express is minimal and unopinionated, appropriate for a focused REST API
  covering authentication, estimation, and reporting endpoints.
- Node.js aligns with the team's JavaScript expertise, enabling context switching
  between frontend and backend without a language barrier.

**Alternatives considered:**
| Alternative | Rejected reason |
|---|---|
| NestJS | Adds abstraction overhead for a V1 API of ~20 endpoints |
| FastAPI (Python) | Language context switch; team is JavaScript-primary |
| Go (Fiber) | No team proficiency; premature optimization for V1 scale |

***

### Database: MongoDB (Docker)

**Rationale:**
- Estimation sessions have variable-schema data (different card sets, optional
  fields per sprint type) — document model fits naturally.
- Team has MongoDB proficiency; operational overhead is low.
- Docker deployment via official `mongo` image provides a consistent local and
  CI environment without a managed cloud dependency in V1.
- Mongoose ODM adds schema validation at the application layer, compensating
  for MongoDB's schemaless nature where field-level contracts are required.

**Alternatives considered:**
| Alternative | Rejected reason |
|---|---|
| PostgreSQL | Relational schema adds migration overhead for evolving sprint data models |
| Supabase | Introduces external cloud dependency; contradicts offline-first V1 requirement |
| Firebase | Vendor lock-in; real-time features are V2 scope only |

***

### Testing: Vitest + @testing-library/react + Playwright

**Rationale:**
- Vitest shares Vite's config and transform pipeline — zero additional build config.
- @testing-library/react enforces user-centric test patterns (testing behavior,
  not implementation), reducing test brittleness.
- Playwright provides cross-browser e2e coverage with the same API as the app's
  TypeScript codebase.

***

## Consequences

**Positive:**
- Single language (TypeScript) across the full stack reduces cognitive overhead.
- Vite's fast feedback loop accelerates iteration on the planning poker UI.
- MongoDB's flexibility accommodates V2 feature additions (WebSockets, AI
  estimation suggestions) without schema migrations.
- Docker-first setup enables consistent onboarding for new contributors.

**Negative / Trade-offs:**
- MongoDB's lack of enforced foreign keys requires application-level integrity
  checks (implemented via Mongoose schema validation and service-layer guards).
- React 19 is bleeding-edge as of V1 — some ecosystem libraries (e.g., recharts)
  required peer dependency overrides (see Épica 3 — Deps Audit).
- Monorepo (shared root package.json) means frontend and backend test runs share
  a single `npm test` — requires careful include/exclude glob configuration
  (addressed in Épica 4 — Toolchain Hygiene).

**Future considerations:**
- If real-time collaboration (WebSockets) is added in V2, evaluate migration
  from Express to Fastify or NestJS for better WebSocket integration.
- If team scales, split the monorepo into `packages/frontend` and
  `packages/backend` with a proper workspace tool (turborepo or nx).
- ADR-002 (Deployment) and ADR-003 (Auth Strategy) to be documented before V2.
