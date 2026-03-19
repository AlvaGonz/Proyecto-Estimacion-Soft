# Task Plan — Estimation Flow Refinement

## Goal
Implement two focused features:
1. **Task completion % in sprint** logic (Backend + Frontend).
2. **"Terminar tarea" button** for Facilitator (Backend + Frontend).

---

## Phases

### Phase 1: Audit and Plan ✅
- [x] Read AGENTS.md, PLANNING.md, and existing context.
- [x] Audit types and existing implementation.
- [x] Fill findings.md with data audit.

### Phase 2: Backend Implementation — Task Completion % ⏳
- [ ] Add `completionPercentage` calculation to task retrieval logic.
- [ ] Update `ITask` model types if necessary.
- [ ] Verify formula inputs: `totalAssignedExperts`, `expertsWhoSubmittedCount`, `roundsCount`, `minRounds`.

### Phase 3: Frontend Implementation — Task Completion % ⏳
- [ ] Update `Task` interface in `types.ts`.
- [ ] Display percentage in Facilitator's dashboard (Project task list).
- [ ] Ensure reactive updates.

### Phase 4: Backend Implementation — "Terminar tarea" (Finalize) ⏳
- [ ] Create `PATCH /projects/:id/tasks/:taskId/finalize` endpoint.
- [ ] Implement `finalizeTask` in `taskService`.
- [ ] Ensure role-based access control (Facilitator only).
- [ ] Block further rounds/estimations.

### Phase 5: Frontend Implementation — "Terminar tarea" Button ⏳
- [ ] Add "Terminar tarea" button to task detail panel.
- [ ] Implement confirmation modal.
- [ ] Wire API call and state refresh.

### Phase 6: Verification ⏳
- [ ] Manual verification as Facilitator.
- [ ] Run E2E tests: `panels.spec.ts`, `dashboard.spec.ts`.
