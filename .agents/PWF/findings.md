# Findings — Estimation Flow Refinement

## Feature 1 — Task completion % data audit
- **Task type fields**: `id`, `projectId`, `title`, `description`, `status`, `finalEstimate`.
- **Round type fields**: `id`, `taskId`, `roundNumber`, `status`, `startTime`, `endTime`, `stats`, `estimations`.
- **Expert submission tracking**: Tracked via `Estimation` model (records per `roundId` and `expertId`).
- **configuredMinRounds field**: Found as `maxRounds` in `Project` interface and `Round` model. Will use `maxRounds` as the target for the formula.
- **Formula inputs available**:
    - `expertsWhoSubmittedCurrentRound`: Count of `Estimation` docs for the current `open` round.
    - `totalAssignedExperts`: `project.expertIds.length`.
    - `completedRounds`: Count of `Round` docs for the task with `status: 'closed'`.
    - `configuredMinRounds`: `project.maxRounds`.
- **Computed: backend or frontend**: Backend preferred for accuracy and centralizing business logic. Will extend task retrieval in `projectService` or `taskService`.

## Feature 2 — "Terminar tarea" button data audit
- **Current task states/statuses in types.ts**: `pending`, `estimating`, `consensus`. (Note: backend constants might have more).
- **Existing task mutation endpoints**: `GET /api/projects/:id/tasks`, `POST /api/projects/:id/tasks`, `PATCH /api/projects/:id/tasks/:tid`.
- **Current role check pattern used for Facilitator-only actions**: `requireRole(ROLES.ADMIN, ROLES.FACILITADOR)` in routes.
- **Finalize endpoint**: Missing. Need to create `PATCH /api/projects/:id/tasks/:tid/finalize`.
- **Task panel component**: Likely `components/EstimationRounds.tsx` or a component in `components/ProjectDetail.tsx`.

---

## Technical Discoveries

### Round/Task Relationship
A task can have multiple rounds. Only one round can be `open` at a time.

### Formulas
`expertParticipationRatio = currentRoundVotes / totalExperts`
`roundProgressRatio = closedRounds / max(minRounds, 1)`

`completionPercentage = Math.min(100, Math.round(((expertParticipationRatio + roundProgressRatio) / 2) * 100))`

*If task status is 'consensus', completion is 100%.*
