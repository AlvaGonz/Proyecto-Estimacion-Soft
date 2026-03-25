# EstimaPro - Active Context

## Current Work Focus
Memory bank initialization - setting up core documentation files for the project.

## Recent Changes
- Created memory-bank directory
- Initialized projectbrief.md with project identity and goals
- Initialized productContext.md with problem statement and solution overview

## Next Steps
1. Complete memory bank core files:
   - systemPatterns.md (architecture and design patterns)
   - techContext.md (technology stack and setup)
   - progress.md (current status and what remains)
2. Review existing codebase to update progress.md accurately
3. Verify all file ownership boundaries per AGENTS.md

## Active Decisions and Considerations

### File Ownership (CRITICAL)
- **Adrian's files:** auth.controller.ts, admin.controller.ts, auth.middleware.ts, rbac.middleware.ts, Login.tsx, AdminPanel.tsx, authService.ts
- **Ray's files:** Project.model.ts, Round.model.ts, Estimation.model.ts
- **Shared:** All other files

### Branch Strategy
- main: production only
- develop: integration branch
- feature/*: one feature per branch (RF/RNF numbered)
- Adrian: feature/RF001-RF005-auth-security, feature/RNF005-docker-ci
- Ray: feature/RF006-RF034-domain-engine, feature/RNF015-RNF022-statistics-convergence

### Code Standards
- TypeScript strict mode everywhere
- React 18 functional components only
- Tailwind CSS with delphi-* color tokens
- Express + Mongoose async/await pattern
- JWT via httpOnly cookies only
- Zod schemas for validation
- No TODO comments - implement fully or create issue
- No `any` type - use `unknown` + type guards

### Planning Protocol
Before implementing any feature:
1. Read .antigravity/skills/planning-with-files/SKILL.md
2. Create PLANNING.md at root
3. Wait for developer approval
4. Update PLANNING.md checkboxes as steps complete
5. Delete PLANNING.md after final commit and PR creation

## Project Insights
- Architecture: Three-Tier (Presentation, Business Logic, Data)
- Estimation Engine: Strategy Pattern for method interchangeability
- Database: MongoDB with Mongoose ODM (document model suits nested estimation data)
- Authentication: JWT with RBAC (3 roles: Admin, Facilitator, Expert)
- Deployment: Docker Compose (nginx, node, mongo containers)