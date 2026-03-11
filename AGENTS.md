# AGENTS.md — Proyecto-Estimacion-Soft
> Repository constitution for AI agents (Cursor, Copilot, Antigravity)

## Project Overview
Multi-method collaborative software estimation platform (Wideband Delphi).
University project — UCE, Escuela de Ingeniería de Software, 2024.
Authors: Adrian Alexander Alvarez Gonzalez | Ray Rubén Ventura López

## Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB (Docker container) |
| Auth | JWT (httpOnly cookies), bcrypt 12 rounds |
| Infra | Docker Compose (3 services: nginx, node, mongo) |

## Build Commands
```bash
# Frontend dev
npm run dev

# Backend dev  
cd server && npm run dev

# Full stack via Docker
docker compose up -d

# Seed database (run once)
cd server && npm run seed

# Backend build
cd server && npm run build
```

## Architecture — File Ownership Map
```
/                          ← Adrian (frontend root)
├── App.tsx                ← Adrian
├── components/
│   ├── AdminPanel.tsx     ← Adrian (RF005)
│   ├── Login.tsx          ← Adrian (RF001-RF002)
│   └── [all others]      ← Shared / Ray
├── services/
│   └── authService.ts    ← Adrian
├── server/src/
│   ├── config/           ← Adrian (shared read)
│   ├── controllers/
│   │   ├── auth.controller.ts    ← Adrian
│   │   ├── admin.controller.ts   ← Adrian
│   │   └── [domain controllers] ← Ray
│   ├── middleware/
│   │   ├── auth.middleware.ts    ← Adrian
│   │   └── rbac.middleware.ts    ← Adrian
│   ├── models/
│   │   ├── User.model.ts         ← Adrian
│   │   └── [domain models]      ← Ray
│   ├── routes/
│   │   ├── auth.routes.ts       ← Adrian
│   │   ├── admin.routes.ts      ← Adrian
│   │   └── [domain routes]     ← Ray
│   └── services/
│       ├── auth.service.ts      ← Adrian
│       ├── admin.service.ts     ← Adrian
│       └── [domain services]   ← Ray
```

## Skills Protocol
Before implementing any feature, the agent MUST:
1. Read `.antigravity/skills/planning-with-files/SKILL.md`
2. Create a `PLANNING.md` at root
3. Wait for developer approval
4. Only then write implementation code

Available skills: `.antigravity/skills/` (46 skills installed)
Key skill paths:
- `.antigravity/skills/planning-with-files/SKILL.md`
- `.antigravity/skills/conventional-commit/SKILL.md`
- `.antigravity/skills/javascript-typescript-jest/SKILL.md`

## Constraints — HARD RULES for agents
- NEVER modify files owned by the other developer without explicit instruction
- NEVER expose JWT tokens in HTTP response body
- NEVER use `any` TypeScript type — use `unknown` + type guards
- NEVER write `// TODO` — implement fully or create a GitHub issue
- ALL commits MUST use conventional commit format
- ALL PRs target `develop`, never `main`
- Password hashing: bcrypt 12 rounds minimum
- Input validation: Zod schemas only (see server/src/types/api.types.ts)
