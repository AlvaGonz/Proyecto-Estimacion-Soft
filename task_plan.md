# Task Plan: Fixing Estimation UI and Enhancements

## Goal
Correct the functional round switching in Wideband Delphi and implement requested enhancements for facilitator control and display accuracy.

## Current Phase
Phase 1: Requirements & Discovery

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Backend Planning & Implementation
- [ ] Add `maxRounds` and `sprints` to Project model
- [ ] Implement Facilitator update controllers for Project settings
- [ ] Add/Update Round stats calculation for Participation % and Global Commitment
- [ ] Ensure Round switching logic handles `maxRounds` correctly
- **Status:** pending

### Phase 3: Frontend Implementation
- [ ] Replace "Your Estimation" modal with "Cumulative Results" for Facilitators
- [ ] Create UI for editing Max Rounds and Sprints in Project Settings
- [ ] Update Participation and Commitment displays with corrected calculations
- **Status:** pending

### Phase 4: Testing & Verification
- [ ] Verify Round switching functionality
- [ ] Test Facilitator edits (Max Rounds/Sprints)
- [ ] Validate calculation accuracy
- [ ] Confirm Facilitator's results view
- **Status:** pending

## Key Questions
1. Where is the exact round switching logic (frontend or backend)?
2. How is "Participation %" defined? (Experts submitted / total invited experts?)
3. How is "Global Commitment" defined? (Tasks committed / total tasks in sprint?)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Update Project Schema | Facilitator needs to configure `maxRounds` and `sprints`. |
| Add new Controller for Project Settings | Separates standard project data from estimation-specific configurations. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| N/A   | 1       |            |

## Notes
- Roles: `UserRole.FACILITATOR` is the target role for most of these edits.
- Wideband Delphi rules (iterative, anonymous) must be preserved.
