## Description
Build the two-step strategy creation flow: configure parameters and calculate variants, then compare and activate one.

## User Stories

### Step 1 - Configure and Calculate
- US-30: Input form with strategy name, start time, fuel/lap, energy/lap, tyre wear, estimated total laps (pre-filled from race)
- US-31: Validation: fuel 0-200, energy 0-100, tyre wear 0-100, total laps > 0
- US-32: "Calculate" runs engine and advances to Step 2 with loading indicator
- US-33: At least 3 variants generated (Normal Pace, Fuel Save, Mixed)

### Step 2 - Compare and Choose
- US-34: Comparison table: variant name, total laps, pit stops, avg pace, feasibility warnings
- US-35: Expand variant to see full stint plan (stint number, driver, laps, fuel, tyres, start time, pit time)
- US-36: Fuel-save variant shows per-driver targets
- US-37: Feasibility warning when tyres insufficient
- US-38: "Use this strategy" activates variant and navigates to execution
- US-39: "Back" returns to Step 1 with values intact

## Acceptance Criteria
- [ ] POST `/api/strategies/:raceId/calculate` returns 3+ variants
- [ ] Each variant contains complete stint plan
- [ ] Strategy engine respects: fuel limit, energy limit (with 0.1% reserve), tyre degradation
- [ ] Stint length = min(fuel limit, energy limit, tyre limit)
- [ ] Fuel Save variant uses 85% of normal fuel/lap
- [ ] Pit time computed from Appendix A (never manual)
- [ ] POST `/api/strategies/:raceId/activate/:id` marks one variant active, creates stint records
- [ ] Step 2 shows expandable stint details
- [ ] Feasibility warning when tyresUsed > availableTyres
- [ ] Back button preserves form state

## Technical Notes
- Strategy engine lives in `server/engine/strategy.js`
- Pit time calculator in `server/engine/pitTime.js`
- Pit time = Refuel time [A1] + Damage repair [A2] + Tyre change [A3]
- See Appendix A in req.md for lookup tables

## Dependencies
- EPIC 0 (Project Setup)
- EPIC 2 (Race Creation - provides race + driver data)
