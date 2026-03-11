# Findings — QA-DEBUG-001

## Initial Discoveries
- [2026-03-11 18:18] **Issue: Infinite Reload Loop**
    - The application is constantly reloading when attempting to access `http://localhost:3000`.
    - Console logs show repeated 401 errors from `/api/auth/me` followed by Vite connection messages.
    - Previous attempt to fix it by commenting out `window.location.href = '/'` in `utils/api.ts` did not solve it for the user/browser agent.
    - Suspect a secondary redirect mechanism or a cycle in `App.tsx` state management triggered by initial auth failure.
    - **Hypothesis: Circular Dependency / Vite Reload.** The ESM importmap in `index.html` might be conflicting with Vite's dependency resolution, or there is a circular dependency in the components that makes Vite's HMR trigger a full reload.

## Backend Status
- `server` is running on port 4000.
- Database is connected.
- Seed data exists with facilitator `aalvarez@uce.edu.do`.

## Frontend Status
- `vite` is running on port 3000 (Vite default is often 5173, but user metadata says 3000).
- Browser agent confirmed UI is visible but unstable due to reloads.
