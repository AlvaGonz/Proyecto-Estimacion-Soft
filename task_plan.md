# Task Plan - Wiring Notification System

## Phase 1: Audit and Analysis
- [ ] Read and map `services/notificationService.ts` API.
- [ ] Audit `components/NotificationCenter.tsx` for supported types and UI contract.
- [ ] Audit `components/TeamPanel.tsx` for `project_invite` (expert assignment).
- [ ] Audit `components/EstimationRounds.tsx` for `round_opened`, `round_closed`, and `consensus_reached`.
- [ ] Audit `components/ProjectDetail.tsx` and `components/AdminPanel.tsx` for other triggering events.
- [ ] Log discoveries in `findings.md`.

## Phase 2: Implementation - Service and Types
- [ ] Update `NotificationType` in `notificationService.ts` to include all 5 events:
  - `project_invite`
  - `round_opened`
  - `round_closed`
  - `consensus_reached`
  - `reminder`
- [ ] Ensure `addNotification` dispatches `notifications_updated` event.

## Phase 3: Implementation - Call Sites
- [ ] Wire `project_invite` in `TeamPanel.tsx`.
- [ ] Wire `round_opened` in `EstimationRounds.tsx` (handleStartNextRound).
- [ ] Wire `round_closed` in `EstimationRounds.tsx` (handleCloseRound).
- [ ] Wire `consensus_reached` in `EstimationRounds.tsx`.

## Phase 4: Implementation - UI Contract
- [ ] Update `NotificationCenter.tsx` to handle all 5 types in `getIcon` and `getIconColorClass`.

## Phase 5: Verification
- [ ] Verify JSX syntax and build errors.
- [ ] Create a manual verification checklist.
