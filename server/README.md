# EstimaPro — Backend API

Backend server for the Wideband Delphi software estimation platform.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 4.19
- **Language:** TypeScript 5.4 (strict mode)
- **Database:** MongoDB 8.x + Mongoose 8.2
- **Auth:** JWT (access + refresh tokens in httpOnly cookies)
- **Validation:** Zod 3.22
- **Testing:** Vitest

## Project Structure

```
src/
├── config/        # Environment, database, and app constants
├── models/        # Mongoose schemas (User, AuditLog)
├── middleware/     # Auth, RBAC, validation, error handler, rate limit
├── routes/        # API route definitions
├── controllers/   # Request handlers
├── services/      # Business logic
├── types/         # TypeScript type definitions
├── utils/         # ApiError, asyncHandler
├── __tests__/     # Vitest unit tests
├── app.ts         # Express app setup
└── server.ts      # Entry point
```

## Setup

```bash
cd server
npm install
cp .env.example .env   # Edit with real values
npm run dev             # http://localhost:4000
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server with hot reload (tsx) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with V8 coverage |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |

## API Endpoints (Stubs)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | Register user |
| `POST` | `/api/auth/login` | — | Login |
| `POST` | `/api/auth/refresh` | — | Refresh token |
| `POST` | `/api/auth/logout` | ✅ | Logout |
| `GET` | `/api/users` | Admin | List users |
| `PATCH` | `/api/users/:id` | Admin | Update user |
| `GET` | `/api/health` | — | Health check |

## Current Status

> ⚠️ **SCAFFOLDING ONLY** — All endpoints return stub responses.
> No database connection, no real authentication, no business logic.

This is Phase 2A scaffolding. See `AGENTS.md` for the full roadmap.

## Next Steps

1. Install dependencies (`npm install`)
2. Implement JWT authentication (Phase 2A Part 2)
3. Connect to MongoDB
4. Implement domain models (Phase 2B)
5. Add integration tests
