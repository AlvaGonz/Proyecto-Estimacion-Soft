# Security Rules

## Secrets Management (ABSOLUTE — zero tolerance)
- Never commit secrets, API keys, JWT secrets, or database URIs to the repository. Use environment variables exclusively.
  - verify: `.env` must be listed in `.gitignore`. Run `git ls-files .env` → must return empty.
  - verify: `grep -r "GROQ_API_KEY\|JWT_SECRET\|MONGO_URI" --include="*.ts" --include="*.tsx" --include="*.js" src/ server/src/` must return 0 matches (env references in code are allowed via `process.env` only).
- All secrets in CI/CD must come from GitHub Actions Secrets via `${{ secrets.NAME }}`. Never interpolate them into workflow YAML as plaintext.

## JWT Security
- Tokens must be stored in `httpOnly` cookies. Never store JWT in `localStorage` or `sessionStorage`.
  - Example of WRONG: `localStorage.setItem('token', jwt)`.
  - Example of CORRECT: Response sets `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict`.
  - verify: `grep -r "localStorage.*token\|sessionStorage.*token" src/` must return 0 matches.
- Access tokens must expire in ≤ 15 minutes. Refresh tokens must expire in ≤ 7 days.

## Input Validation (BOTH layers — never skip one)
- All user-submitted data must be validated with Zod on the **frontend** (`src/utils/schemas.ts`) AND on the **backend** (`server/src/modules/<domain>/validators/`).
  - verify: Every POST/PATCH route handler must call a Zod schema's `.parse()` or `.safeParse()` before touching the controller logic.

## Data Sanitization
- Backend must sanitize MongoDB query inputs to prevent NoSQL injection. Never interpolate raw request body fields directly into Mongoose queries.
  - Example of WRONG: `User.findOne({ email: req.body.email })` without prior Zod validation.
  - Example of CORRECT: Validate with Zod schema first, then pass the typed result to Mongoose.
- Frontend must escape all user-generated content rendered as HTML to prevent XSS.

## Dependency Hygiene
- `npm audit` must run on every CI build. Any HIGH or CRITICAL severity CVE must block the merge.
  - verify: CI `lint` job includes `npm audit --audit-level=high` step (or equivalent).
  - verify: `npm audit` locally returns 0 HIGH/CRITICAL vulnerabilities before any PR.

## Password Hashing
- User passwords must be hashed with bcrypt (minimum 12 rounds) on the backend before storage. Never return password hashes in API responses.
  - verify: Mongoose `User` model has a `pre('save')` hook that hashes the password.
  - verify: `toJSON` transform on User model excludes the `password` field.
