# Lessons Learned — EstimaPro
## SETUP — 2026-03-25 — CI/CD
**Mistake:** typecheck job in ci.yml called npm run lint instead of npx tsc --noEmit
**Rule:** Never copy-paste CI jobs without verifying the run command is correct
**Applies to:** .github/workflows/ci.yml, all future workflow jobs
