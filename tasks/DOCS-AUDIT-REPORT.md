## [2026-03-27] Épica 5 — Pre-flight Documentation Gap Audit

### README.md Current State
Has Setup section: YES (Guía de Instalación)
Has docker-compose steps: YES (Despliegue con Docker)
Has .env setup: YES (Manual echo, not referencing .env.docker.example)
Has scripts/ section: NO (Has Comandos Disponibles, but no scripts/ directory reference)
Broken/outdated commands:
- Tech Stack: Lists React 18 (Real: 19), Tailwind 3 (Real: 4).
- Backend start: Mentions `npm run start` but root package.json has no such script.
- Ports: Mentions 3000 (frontend) and 4000 (backend), matches docker-compose.

### AGENTS.md Command Audit
| Command in AGENTS.md | In package.json | Status |
|---------------------|----------------|--------|
| `npm run build` | YES | VALID |
| `npm run test -- --run` | NO | STALE (Actual: `npm run test`) |
| `npm run dev` | YES | VALID |
| `docker-compose up -d` | N/A | VALID (Matches docker-compose.yml) |
| `npm run typecheck` | YES | VALID |

### docs/ directory
Exists: YES → Action: NONE

### Package.json Scripts (Source of Truth)
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "tsc --noEmit",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --config vite.config.ts",
  "test:watch": "vitest",
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui",
  "e2e:report": "playwright show-report",
  "e2e:check": "tsx e2e/check-servers.ts",
  "e2e:safe": "tsx e2e/check-servers.ts && playwright test",
  "e2e:headed": "playwright test --headed",
  "e2e:debug": "playwright test --debug",
  "e2e:reset-auth": "node -e \"require('fs').rmSync('e2e/.auth', { recursive: true, force: true }); console.log('Auth state cleared.')\"",
  "e2e:fresh": "npm run e2e:reset-auth && npm run e2e"
}
```
