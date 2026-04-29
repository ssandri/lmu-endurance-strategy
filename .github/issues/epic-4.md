## Description
Build the race execution view for live stint tracking, confirmation, and dynamic strategy recalculation.

## User Stories

### Driver Order
- US-50: Drag/reorder driver rotation at any time; applied to future stints only

### Stint Confirmation
- US-51: Show current stint + next 3-5 planned stints (driver, laps, est. start time)
- US-52: "Confirm as planned" marks stint completed at planned laps
- US-53: "Confirm with adjustment" allows actual end lap entry, triggers recalculation
- US-54: Pit stop form: energy added (default ~99.5%), fuel added (required), tyres changed (0-4, default 4), damage type (None/Bodywork/Bodywork+RW/Yellow/Orange/Red). Pit time computed from Appendix A.
- US-55: After confirmation, all future stints recalculated automatically

### Estimated Laps
- US-56: "Update estimated laps" control always visible; triggers recalculation

### Recalculation
- US-57: Confirmed stints never overwritten
- US-58: Execution view refreshes within 2s of any trigger

## Acceptance Criteria
- [ ] GET `/api/stints/:raceId` returns all stints for active strategy
- [ ] POST `/api/stints/:raceId/confirm/:stintId` accepts actual data and recalculates
- [ ] Pit time computed: refuel [A1] + damage [A2] + tyres [A3] - never manual (NF-07)
- [ ] Recalculation preserves confirmed stints, replans future only
- [ ] Driver reorder updates rotation_order, applies to future stints
- [ ] PATCH `/api/races/:id` with estimatedTotalLaps triggers recalculation
- [ ] Execution view shows current stint, upcoming stints, completed history
- [ ] Confirmed stints show actual pit time and damage
- [ ] Energy default fills to 99.1-99.9% (below 0.1% reserve DQ threshold)

## Technical Notes
- `recalculateFromLap()` in strategy engine handles replanning
- Damage types and times from Appendix A2
- Tyre change times from Appendix A3
- Race events logged on each confirmation

## Dependencies
- EPIC 0 (Project Setup)
- EPIC 3 (Strategy - provides active strategy + stints)
