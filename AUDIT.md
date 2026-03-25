# EstimaPro Audit Report

## 1. Structural Audit Findings

| Current Location | Target Location | Action |
|------------------|-----------------|--------|
| `components/` | `src/components/` & `src/features/` | Move & Modularize |
| `services/` | `src/services/` | Move |
| `utils/` | `src/lib/` & `src/utils/` | Move |
| `App.tsx`, `index.tsx`, `index.css` | `src/app/` & `src/pages/` | Move & Refactor |
| `types.ts` | `src/types/` | Move |
| `server/src/controllers/`, `services/`, `routes/`, `models/` | `server/src/modules/<domain>/` | Modularize |
| `server/src/middleware/`, `config/`, `utils/`, `types/` | `server/src/shared/` & `server/src/app/` | Move |

## 2. Dead Code & Stale Artifacts
The following files and directories are unused, stale, or hold legacy assumptions and will be deleted:

- `_project_specs/` (Legacy Gemini memory bank)
- `agent-skills/` (Python virtual environment, pyvenv.cfg, etc. Not an actual skill repo)
- `autogen_test.py`, `groq_test.py`, `requirements.txt` (Python agent drafts)
- `.venv/` (Python virtual env)
- `.cursorrules` (Superseded by Antigravity rules)
- `PLANNING.md` (Completed installation plan)
- `metadata.json` (Bolt/Gemini artifact)
- `server/dist/` (Should be ignored, not tracked)
- `.cache/` (Should be ignored)

## 3. Boundary Violations & Security Issues
- **Security:** `server/.env` contains a hardcoded Groq API key and JWT dev secrets in git history. Needs to be gitignored and keys rotated.
- **Frontend Logic:** `App.tsx` contains heavy state management and routing logic (606 lines) instead of proper domain separation.
- **Frontend Logic:** `services/convergence.service.ts` contains convergence math that belongs on the backend, though currently acceptable for frontend display if mirrored by backend.
- **Missing Backend Modules:** Based on the LDR, the backend is missing dedicated modules for Notifications and Reports, and dedicated routes for Metrics and Convergence.

## 4. Unused Dependencies
- Frontend: `concurrently` (not used in scripts).
- Frontend: `@google/genai` (verify usage in `geminiService.ts`).
- Backend: `eslint`, `prettier` (verify usage in CI/CD).

## 5. Next Steps
1. Delete all dead code and stale artifacts.
2. Refactor frontend to use the `src/` feature-based architecture.
3. Modularize the backend by domain.
4. Integrate Antigravity workspace rules and workflows.
5. Provide the final repository documentation.
