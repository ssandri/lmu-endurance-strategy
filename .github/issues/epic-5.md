## Description
Build the visual timeline and driver summary views for team communication.

## User Stories
- US-60: Colour-coded timeline with proportional blocks per stint, confirmed vs planned visually distinct
- US-61: Changeover table: stint number, driver, start/end lap, wall-clock start time
- US-62: Per-driver summary cards: total stints, total laps (planned + confirmed), estimated drive time
- US-63: "No strategy yet" placeholder when no active strategy

## Acceptance Criteria
- [ ] Timeline renders proportional coloured blocks per stint
- [ ] Each driver has a distinct colour with legend
- [ ] Confirmed stints are filled, planned stints are outlined/faded
- [ ] Changeover table lists all stints in order with wall-clock times (when start time set)
- [ ] Driver summary cards show: stints count, planned laps, confirmed laps, est. drive time
- [ ] Updates after every recalculation
- [ ] "No strategy yet" message when no active strategy exists

## Dependencies
- EPIC 0 (Project Setup)
- EPIC 4 (Race Execution - provides stint data)
