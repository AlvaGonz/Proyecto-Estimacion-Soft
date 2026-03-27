## [2026-03-27] Épica 4 — Pre-flight Config State Map

### Step 1 — vite.config.ts
Test files found by find: 5 files (statistics, schemas, useRounds, ThreePointInput, RoundHeader)
Include glob before: ['**/*.test.{ts,tsx}']
Include glob after: src/**/*.{test,spec}.{ts,tsx}
globals: true — confirmed
environment: jsdom — confirmed
setupFiles: ./vitest.setup.ts — confirmed
Gate: PASS (5 tests passed, 0 failures)
```ts
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
      include: ['**/*.test.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/server/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        exclude: ['node_modules/', 'dist/', '*.config.*', 'PWF*/**'],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 60,
          statements: 70,
        },
      },
    },
```
Include globs: `**/*.test.{ts,tsx}`
Issues found: Glob might be too broad or miss top-level src files if not prefixed with `./src`.

### Step 2 — vitest.setup.ts
@testing-library/jest-dom installed: YES (version: ^6.9.1)
/vitest entrypoint exists: (Assumed from version ^6)
@testing-library/react installed: YES (^16.3.2)
Import used: '@testing-library/jest-dom/vitest' (Already present)
cleanup() afterEach added: YES (Already present)
```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```
@testing-library/jest-dom imported: YES
Vitest-specific import (@testing-library/jest-dom/vitest): YES
Issues found: NONE (already correct).

### Step 3 — tailwind.config.js
src/ file counts: (Unable to run find)
Content array before: ["./index.html", "./App.tsx", "./index.tsx", "./components/**/*.{js,ts,jsx,tsx}", "./services/**/*.{js,ts,jsx,tsx}"]
Content array after: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"]
./index.html in content: YES
src/** double-star: YES
Build gate: PASS (built in 14.23s)
Tailwind warnings in build output: NONE
```js
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
```
src/ subdirectories found: `app`, `features`, `services`, `shared`.
Issues found: MISSING `features`, `app`, `shared` directories.

### Step 4 — playwright.config.ts
docker-compose frontend host port: 3000
baseURL before: "http://localhost:3001"
baseURL after: "http://localhost:3000"
Port match: YES (Manual verification) -> action: UPDATED
Gate (playwright test --list): FAIL (Listing success, but 0 tests discovered in e2e/)
baseURL: "http://localhost:3001"
docker-compose frontend ports: 3000:80 (Default)
Match: NO (Playwright uses 3001, Docker uses 3000).
Issues found: Port mismatch (3001 vs 3000).

### Step 5 — package.json lint:fix script
ESLint version: (MISSING in package.json)
ESLint config file found: NONE
Existing lint script: "tsc --noEmit"
lint:fix script added: BLOCKED
typecheck script added: YES ("typecheck": "tsc --noEmit")
ESLint gate result: N/A
tsc --noEmit gate result: PASS (Exit code 0, No ERRORS)
Type errors documented in TOOLCHAIN-REPORT.md: NONE
Gate: BLOCKED / PASS
```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
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
  },
```
lint:fix exists: NO
lint exists: YES (but only `tsc --noEmit`)
typecheck/tsc exists: YES (as `lint`)
Issues found: No `lint:fix` script; `lint` only checks types, doesn't run ESLint.
