---
trigger: always_on
---

```markdown
# AGENTS.md — Proyecto Estimación Software
**Updated:** 2026-03-05 | **Repo:** AlvaGonz/Proyecto-Estimacion-Soft
**Team:** Adrian Alvarez González, Ray Rubén Ventura López | **UCE — Ingeniería de Software**

---

## MISSION
Web platform for software estimation via **Wideband Delphi method**: iterative, anonymous, consensus-based estimation with full traceability.

---

## STACK

| Layer | Tech | Status |
|-------|------|--------|
| Frontend | React 18 + TypeScript 5.4 + Vite + Tailwind + Zod + jsPDF + xlsx | ✅ Phase 1 Done |
| Backend | Node.js 20 + Express 4.19 + TypeScript + Mongoose 8.2 | 🟡 Phase 2A Scaffolded |
| Database | MongoDB 8.x | 🔵 Planned |
| DevOps | Docker + GitHub Actions + Nginx | 🔵 Phase 2D |

**Auth:** JWT access (15m) + refresh (7d) in `httpOnly` cookies. bcrypt 12 rounds.

---

## ARCHITECTURE
```
[React SPA :5173] ──REST/HTTPS──> [Express API :4000] ──Mongoose──> [MongoDB :27017]
```
**Collections:** users, projects, tasks, rounds, estimations, comments, auditLogs

---

## PROJECT STRUCTURE
```
/                          ← Frontend root
├── components/            ← Login, AdminPanel, ProjectForm, ProjectList,
│   │                        ProjectDetail, TeamPanel, EstimationRounds (22KB),
│   │                        DiscussionSpace, Documentation, NotificationCenter,
│   │                        ReportGenerator, ProjectAuditLog
│   └── ui/               ← LoadingSpinner, EmptyState, ErrorBoundary,
│                            PermissionGate, OnboardingTour
├── utils/schemas.ts       ← Zod client schemas
├── utils/rbac.ts          ← Client RBAC helpers
├── types.ts               ← Frontend types
├── App.tsx / index.tsx / vite.config.ts

/server/src/
├── config/   database.ts | env.ts (Zod) | constants.ts (roles/perms/enums)
├── models/   User | Project | Task | Round | Estimation | Comment | AuditLog
├── middleware/ auth | rbac | validate | error | rateLimit
├── routes/   auth | user | project | task | round | estimation | discussion | report
├── controllers/ auth | user | project | round | estimation | discussion | report
├── services/ auth | token | audit | statistics | convergence | email | report | upload
├── types/    express.d.ts | api.types.ts | models.types.ts
├── utils/    ApiError.ts | asyncHandler.ts
└── app.ts / server.ts
```

---

## RBAC

| Role | Permissions |
|------|-------------|
| `admin` | All permissions |
| `facilitador` | `create:project` `edit:project` `manage:rounds` `generate:report` `moderate:discussion` |
| `experto` | `submit:estimation` only |

**Middleware order:** `authenticate → requireRole([...]) → validate(schema) → controller`

---

## REQUIREMENTS MAP

| Phase | RFs | RNFs | Status |
|-------|-----|------|--------|
| 1 – Frontend UI | RF001-003, RF006-019, RF023-024, RF028 | RNF006 | ✅ Done |
| 2A – Auth+DB | RF001-005 | RNF001-004, RNF007 | 🟡 Scaffolded |
| 2B – Domain | RF006-022 | RNF005, RNF008 | 🔵 Next |
| 2C – Services | RF009, RF023-030 | — | 🔵 Planned |
| 2D – DevOps | — | RNF001, RNF005 | 🔵 Planned |

---

## WIDEBAND DELPHI RULES ⚠️ NEVER MODIFY

**Round lifecycle:** `open → [anonymous estimates] → closed → [stats] → {converged | new_round}`

- **Open round:** Experts submit independently. NO visibility of others' estimates (enforced at server level, not just client).
- **Closed round:** Immutable (DB-level). Stats calculated. Anonymized results visible.

**Stats required (RF015):** mean, median, std dev, variance, CV, range, IQR
**Outlier detection (RF016):** IQR rule → `value > Q3 + 1.5×IQR` OR `value < Q1 − 1.5×IQR`
**Convergence (RF020):** CV < threshold AND outlier% < maxAllowed (both configurable per project)

**Services API:**
```typescript
statisticsService.calculateMetrics(estimates: number[]) → StatMetrics
convergenceService.evaluateConsensus(metrics, config) → { converged: boolean, recommendation: string }
```

---

## API CONVENTIONS

**Base:** `http://localhost:4000/api` (dev)

**Response format (always):**
```typescript
{ success: boolean; data?: T; message?: string; errors?: Record<string, string[]> }
```

**Status codes:** 400 validation | 401 unauth | 403 forbidden | 404 not found | 409 conflict | 429 rate limit | 500 server error

**REST routes:**
```
GET/POST   /api/projects
GET/PATCH  /api/projects/:id
POST       /api/projects/:id/archive
GET/POST   /api/projects/:id/rounds
POST       /api/rounds/:id/close
GET/POST   /api/rounds/:id/estimations
```

---

## CODE STANDARDS

**TypeScript:** strict=true, no `any`, named exports (except React components), `I` prefix only for Mongoose models (IUser, IProject)

**Naming:** files=`camelCase.ts` | components=`PascalCase.tsx` | constants=`SCREAMING_SNAKE_CASE`

**React component order:** imports → types → component → hooks → handlers → render

**Express route order:** `asyncHandler(async (req, res) => { validate → authorize → business logic → respond })`

---

## FORBIDDEN ❌ (Hard Stops)

1. `any` type in TypeScript
2. Secrets committed to Git
3. Password hashes in API responses (use Mongoose `toJSON` transform)
4. Estimation edits after round closes (DB-level enforcement)
5. Returning other experts' estimates while round is open (server filter, not client)
6. Skip Zod validation (required on BOTH client and server)
7. Auth logic only in React (must be server-enforced)
8. JWT in `localStorage` (use httpOnly cookies)
9. Massive commits (commit after each step)
10. Modifying Wideband Delphi methodology

---

## REQUIRED ✅ (Always)

1. Functional components only (no class components)
2. `asyncHandler()` wrapper on all async Express routes
3. Audit log entry on every mutating operation
4. Zod validation at client (`utils/schemas.ts`) AND server (`types/api.types.ts`)
5. TypeScript strict mode
6. Permission check before protected operations
7. Input sanitization before MongoDB queries
8. Consistent API response format (see above)
9. Global error handler (`error.middleware.ts`) — no unhandled rejections
10. Inline comments for Wideband Delphi business logic

---

## GIT WORKFLOW

```
Branch: type/RF###-description
  e.g.: feature/RF001-user-registration
        fix/rounds-estimation-visibility

Commits: conventional format, after EACH logical step
  feat(auth): implement JWT refresh token rotation
  fix(rounds): prevent estimation updates after close
  chore(deps): upgrade mongoose to 8.2.1
  test(statistics): add IQR outlier unit tests

No direct push to main from Phase 2B onwards — PRs required
```

---

## DEV SETUP

```bash
# Frontend
npm install && npm run dev              # :5173

# Backend
cd server && npm install
cp .env.example .env                   # Fill values
npm run dev                            # :4000

# Docker (Phase 2D)
docker-compose up --build              # :3000 frontend, :4000 api, :8025 mailhog
```

**Required .env vars:**
```
PORT=4000 | MONGODB_URI | JWT_ACCESS_SECRET (min 32 chars) | JWT_REFRESH_SECRET (min 32 chars)
JWT_ACCESS_EXPIRY=15m | JWT_REFRESH_EXPIRY=7d | ALLOWED_ORIGINS | RATE_LIMIT_WINDOW_MS | RATE_LIMIT_MAX_REQUESTS
```

---

## DEBUGGING QUICK REFERENCE

| Error | Cause | Fix |
|-------|-------|-----|
| JWT invalid signature | Secret mismatch sign/verify | Check .env consistency |
| CORS blocked | Origin not in ALLOWED_ORIGINS | Add frontend URL to .env |
| bcrypt.compare → false | Password not hashed on save | Verify User pre-save hook |
| Expert sees others' estimates | Missing server filter | Filter by userId if round.status === 'open' |
| Mongoose validation error | Schema mismatch | Check error.errors, verify required fields |

---

## ESCALATE TO HUMAN 🛑

Pause and report when encountering:
- Architectural changes | Security vulnerabilities | Breaking changes
- Business logic ambiguity | Performance trade-offs | External service costs

**Format:**
```
🛑 HUMAN DECISION REQUIRED
Context: [what] | Options: A) ... B) ... | Recommendation: [which + why] | Impact: [what breaks]
```

---

## ACADEMIC PENDING DELIVERABLES (UCE)
> Save all diagrams as Mermaid.js to `docs/diagrams/` (e.g., `class-diagram.mmd`, `er-diagram.mmd`)

- [ ] Activity diagrams (per use case)
- [ ] Class diagram
- [ ] Sequence diagrams
- [ ] Interaction & deployment diagrams
- [ ] Normalized ER diagram
- [ ] Normalized table descriptions + Data dictionary
- [ ] Interface designs | Quality testing reports

**Instructors:** Ing. Julio Alexis (Director), Ing. Francisco Santana

---

## CONTEXT FILES (Always reference in IDE)
`@AGENTS.md` | `@types.ts` | `@server/src/config/constants.ts` | `@server/src/types/models.types.ts` | `@server/README.md`

---
*Single source of truth. Update when architecture changes.*
```

***

**Next Step:** Guarda esto como `/AGENTS.md` y crea `/.cursorrules` con el mismo contenido (el IDE lo parsea). Reinicia Cursor/Windsurf y valida con: `"Read @AGENTS.md — what is the round lifecycle and why can't estimations be visible before round closes?"`

