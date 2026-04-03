# Implementation Plan: High-Value Skill Audit & Improvement

## 1. Context & Rationale
An audit of the `tasks/loop-log.md` and `tasks/error-patterns.md` reveals recurring failures in two key areas:
1. **Git Lifecycle**: Consistent failure to follow Conventional Commits and branch protection rules.
2. **Domain Integrity**: Potential for violating the sacred "3-tier boundary" and Delphi Method invariants (e.g., modifying closed rounds).

## 2. Proposed Changes

### A. Repository Rules Improvement
- **Create `.agent/rules/git-conventions.md`**: This file is referenced in `AGENTS.md` but is missing. It will define strict rules for:
    - Branch naming (`feature/`, `fix/`, etc.).
    - Conventional Commit format (`feat(scope): ...`, `fix(scope): ...`).
    - Scope requirements (based on `src/features/` or `server/src/modules/`).

### B. New Specialized Skill: `delphi-logic-guard`
- **Location**: `.agent/skills/delphi-logic-guard/SKILL.md`
- **Purpose**: A "Constraint Engine" that the agent must load when modifying any file in `src/features/rounds/`, `src/features/estimations/`, or `utils/`.
- **Invariants to Protect**:
    - **Method Lock**: Estimation method cannot change after Round 1 starts.
    - **Round State**: No estimations can be added/modified in `closed` rounds.
    - **Convergence Logic**: CV calculations must use the standardized formula in `src/utils/`.
    - **Role Hierarchy**: Facilitator is the only one who can advance rounds.

### C. Skill Update: `commit` (Local Override)
- **Location**: Create a local override or update the existing one if possible to trigger strictly on the new `git-conventions.md`.

## 3. Implementation Steps

### Phase 1: Foundation (Rules & Conventions)
1.  [X] Create `.agent/rules/git-conventions.md`.
2.  [ ] Update `.agent/rules/agent-behavior.md` to prioritize these new conventions.

### Phase 2: Domain Guarding (New Skill)
1.  [ ] Scaffold `.agent/skills/delphi-logic-guard/SKILL.md`.
2.  [ ] Add "How it Works" section with specific logic checks.

### Phase 3: Integration
1.  [ ] Update `AGENTS.md` to register the new skill and rule.
2.  [ ] Run `/audit-chores` (if it exists) to verify compliance.

## 4. Risks & Mitigations
- **Risk**: Over-constrained agent.
- **Mitigation**: Use "Warning" levels in the skill instead of hard blocks where creative freedom is needed.
- **Risk**: Missing `git-conventions.md` was intentional?
- **Mitigation**: `AGENTS.md` explicitly lists it in Section 6, so it's a documentation gap that needs filling.
