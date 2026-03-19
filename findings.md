# Findings & Decisions: Estimation UI Fixes and Enhancements

## Requirements
- **Fix Round Switching**: The Wideband Delphi round switching is not working correctly.
- **Facilitator Edits**:
    - Allow facilitator to edit the number of rounds per task.
    - Allow facilitator to edit the number of sprints.
- **Accuracy Fixes**: Correct percentage calculations for participation and global commitment.
- **Facilitator View Update**:
    - Facilitator should not see the "Your Estimation" modal.
    - Instead, display a modal with cumulative results (accumulated results).

## Research Findings
- **Backend Architecture**: Express API with Mongoose models. Roles: `admin`, `facilitador`, `experto`.
- **Project Model**: `convergenceConfig` handles `cvThreshold` and `maxOutlierPercent`. Currently lacks `maxRounds` or `sprintCount` if those are intended to be project-level.
- **Task Model**: Has `projectId`, `title`, `description`, `status` (`pending`, `estimating`, `consensus`), and `finalEstimate`.
- **Round Model**: Tracks `roundNumber`, `status` (`open`, `closed`), and `stats`.
- **Estimation Model**: Stores individual expert values and justifications.
- **Frontend State**: Controlled in `App.tsx` (based on `estimacion-soft.md`). Components are pure functional components.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Add `maxRounds` and `sprintCount` to Project schema | Facilitator needs to configure these per project. |
| Update `RoundStats` calculation logic | Inaccurate percentages reported; need to verify denominator (total experts vs active experts). |
| Implement `CumulativeResultsModal` for facilitators | Replaces the individual estimation prompt as requested. |

## Resources
- Project Structure: `@AGENTS.md`
- Business Rules: `@estimacion-soft.md`
- Backend Config: `server/src/config/constants.ts`
- Models: `server/src/models/`

## Visual/Browser Findings
- Captured images `media__1773961100619.png` and `media__1773961118076.png` show estimation UI and charts.
- `media__1773960907747.png` likely shows the current round/task list.
- Observation: Percentage bars in screenshots might not sum correctly or reflect the actual participation vs invited experts.
