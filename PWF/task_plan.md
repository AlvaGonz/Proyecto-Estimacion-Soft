# Task Plan: EstimaPro Estimation Flow Fixes

## Phase 1 — Diagnose current state before changing code
- [ ] Understand how app determines if expert estimated (by projectId vs taskId/roundId/expertId).
- [ ] Understand where button label is computed.
- [ ] Understand where reminder notifications are triggered and who receives them.
- [ ] Understand where the unit of measure is sourced from.
- [ ] Understand where the debate date is formatted.
- [ ] Understand where project logs are loaded/rendered.

## Phase 2 — Fix estimation button logic for all rounds
- [ ] Update logic to strictly check `currentTask.id + currentRound.id + currentUser.id`.
- [ ] Ensure button label shows "Editar estimación" if estimation exists and round is OPEN.
- [ ] Ensure click opens form prefilled with existing values.
- [ ] Ensure submit triggers an update instead of a create.
- [ ] Disable editing if round is CLOSED.

## Phase 3 — Implement safe edit flow
- [ ] Prefill form upon edit request.
- [ ] Show confirmation modal before overwriting.
- [ ] Update `value`, `justification`, `metodoData`, `timestamp`.
- [ ] Block edits across rounds, or for other experts.

## Phase 4 — Reminder notifications only for pending experts
- [ ] Modify reminder logic to target only experts assigned who have *not* estimated for the specific `taskId` + `roundId`.
- [ ] Ensure notification message is clear and includes task title and round number.
- [ ] Ensure the trigger correctly fires off local events for `NotificationCenter`.

## Phase 5 — Correct measurement unit
- [ ] Verify unit source (from project configuration).
- [ ] Ensure it renders in inputs, live results, closed results, and logs.

## Phase 6 — Live results from the first estimation
- [ ] Modify results modal to show live aggregations based on current count of estimations, starting from 1.
- [ ] Implement conditional live metrics depending on method (Delphi, Poker, Three-Point).
- [ ] Keep final close-round statistical report intact.

## Phase 7 — Correct debate date
- [ ] Fix timestamp formatting in `DiscussionSpace.tsx` (or whenever comments are rendered).
- [ ] Format in Spanish: e.g., "23 mar 2026, 6:41 PM".

## Phase 8 — Relevant logs for this project section
- [ ] Render logs specifically for current task / round / context.
- [ ] Use stable keys for lists.

## Phase 9 — Final Code Review and Verification
- [ ] Do final checks list.
- [ ] Propose commit message.
