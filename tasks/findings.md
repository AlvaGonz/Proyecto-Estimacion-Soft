# Findings: Research and Discoveries

## Architecture Current State
- Tech stack: React 19 + Vite 6 + TS 5.8
- Backend state: Contradictory info (`AGENTS.md` vs `estimacion-soft.md`). Current build seems to be frontend-only SPA.
- Directory structure undergoing reorganization (`src/features`, `src/shared`).

## Error Discoveries
- **Module Import Error:** [RESOLVED] Fixed `PermissionGate.tsx` import.
- **Docker Failure:** Missing `.env.docker`. `docker-compose.yml` expects this file for backend and seeder services.
- **Port Conflict:** App was running on different ports (3001, 3002). User requires persistent 3001.

## Proposed Fixes
- [x] Fix `round.service.ts` build error (Removed unnecessary `.toJSON()` in service layer to avoid IRound/Document type mismatch).
- [x] Integrate `/api` relative proxy in `vite.config.ts` and `.env.docker` to unify local and container connectivity through Nginx.
- [x] Enforce `STRICT: localhost:3001` across all configurations.

## Conclusion
The application is now container-ready and follows a robust proxy-first architecture that works both in local dev (via Vite proxy) and Docker (via Nginx proxy).
- Frontend: Port 3001 (Persistent)
- Backend: Port 4000 (Internal/External)
- Database: Port 27017 (Mongo)
