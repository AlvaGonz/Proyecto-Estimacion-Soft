---
name: api-preconditions
description: "Structured session setup and local state preparation for E2E tests."
risk: low
source: project
date_added: "2026-04-02"
---

# API Preconditions

Use these methods to set up local state (localStorage, cookies, or IndexedDB) before running E2E tests.

## 1. Local Storage Sync
Since the project is SPA-only and state is in `App.tsx` (derived from local storage or memory), use `page.evaluate` to inject data.

```typescript
await page.addInitScript((data) => {
  localStorage.setItem('estima-pro-state', JSON.stringify(data));
}, projectData);
```

## 2. Authentication Mocking (JWT)
If JWTs are used (as per `AGENTS.md`), inject them into local storage.

```typescript
localStorage.setItem('auth_token', 'mocked_jwt_token');
```

## 3. Component Initial State
Load the application at: `http://localhost:5173/` (Vite 6 default).

## 4. Test User Scenarios
- **Facilitator Session**: User with `UserRole.FACILITATOR`.
- **Expert Session**: User with `UserRole.EXPERT`.
- **Closed Round**: Session where one or more rounds are already in `status: 'CLOSED'`.
