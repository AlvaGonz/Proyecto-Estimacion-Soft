# 🗺️ Project Documentation Summary — EstimaPro

## 1. Business Constraints (Reglas de Negocio)
- **Roles & Permissions (RBAC):**
  - `Admin`: Gestión de usuarios y configuración global.
  - `Facilitador`: Creación de proyectos, gestión de tareas y rondas, generación de reportes.
  - `Experto`: Emisión de estimaciones, participación en discusiones.
- **Estimation Lifecycle:**
  - Projects: `Preparación` → `Kickoff` → `Activo` → `Finalizado`.
  - Tasks: `Pendiente` → `Estimando` → `Consensuada`.
  - A task reaches `Consensuada` only when the convergence threshold is met.
- **Rules of Integrity:**
  - Round status must be managed by the Facilitator.
  - Estimations can only be sent by Experts.
  - Rounds must be closed before final calculations.
  - Statistical logic (mean, stdDev, etc.) must reside in `utils/`.

## 2. Frontend Acceptance Criteria
- **Tech Stack:** React 19 + Vite 6 + TypeScript 5 + Tailwind CSS 4.
- **Performance & State:**
  - No `useEffect` for derived state; use `useMemo`.
  - State managed in `App.tsx` (drilling limited to 3 levels) or Context API.
- **UX/UI Guidelines:**
  - Accessible design (WCAG AA target).
  - Use `lucide-react` for icons.
  - Error boundaries for high-risk views.
- **Code Quality:**
  - Max file length: 300 lines.
  - Max function length: 30 lines.
  - Named exports preferred.
  - Types must be imported from `types.ts`.

## 3. Architecture Boundaries
- **3-Tier Separation:** Frontend (presentation) ↔ Backend (business logic) ↔ DB (data).
- **Feature-Based structure:** `src/features/<domain>/` for domain logic, `src/components/` for reusable UI.
- **Security:** JWT authentication on all protected routes. Sanitize inputs. No hardcoded secrets.

---

# 🛠️ Skill Inventory & Selection

| Skill Name | Status | Justification |
|------------|--------|---------------|
| `audit-context-building` | ✅ ACTIVE | Essential for Phase 1 mapping and deep analysis. |
| `accessibility-compliance-accessibility-audit`| ✅ ACTIVE | Required for WCAG AA audit in Phase 2.1. |
| `baseline-ui` | ✅ ACTIVE | Required for design consistency review in Phase 2.1. |
| `code-refactoring-refactor-clean` | ✅ ACTIVE | Used for applying improvements in Phase 2.2. |
| `code-review-excellence` | ✅ ACTIVE | Required for verification in Phase 3.1 and self-reflection in Phase 4.1. |
| `codebase-audit-pre-push` | ✅ ACTIVE | Used for final validation gate in Phase 3.1. |
| `agent-orchestration-improve-agent` | ✅ ACTIVE | Orchestrates self-reflection and auto-improve loop. |
| `antigravity-workflows` | ✅ ACTIVE | Handles workflow coordination. |
| `commit` | ✅ ACTIVE | Handles version control tasks. |

> [!IMPORTANT]
> Non-related skills (AWS, Azure, etc.) are discarded to minimize noise.
