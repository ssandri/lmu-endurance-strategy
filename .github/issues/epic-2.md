## Description
Build the race creation form with all parameters needed for accurate strategy calculations.

## User Stories
- US-10: Race name pre-filled as "Track - Date - N" (editable)
- US-11: Track dropdown with all supported LMU tracks + "Other" free text
- US-12: Duration defaults to 12h, any positive number accepted
- US-13: Fuel consumption per lap (default 0, >= 0)
- US-14: Energy consumption per lap (default 0, 0-100, 0.1% reserve enforced)
- US-15: Tyre degradation per lap (FL/FR/RL/RR, default 0, 0-100)
- US-16: Per-driver average lap pace in M:SS.mmm format
- US-17: Multiple drivers by name (at least one required, blank rows ignored)
- US-18: Available tyres (default 32)
- US-19: Estimated total laps (required)
- US-20: After save, navigate to Strategy Creation Step 1

## Acceptance Criteria
- [ ] POST `/api/races` validates all fields per constraints above
- [ ] Race name auto-generates from track + date, suffix increments
- [ ] Track dropdown includes all tracks from req.md + "Other"
- [ ] Lap time validates M:SS.mmm format, rejects invalid input inline
- [ ] At least one non-blank driver required
- [ ] On successful save, redirects to `/races/:id/strategy/new`
- [ ] Database stores: race, drivers with rotation_order and avg_lap_time_ms

## Data Model
- Race: id, user_id, name, track, duration_hours, fuel_per_lap, energy_per_lap, tyre_deg_fl/fr/rl/rr, available_tyres, estimated_total_laps
- Driver: id, race_id, name, avg_lap_time_ms, rotation_order

## Dependencies
- EPIC 0 (Project Setup)
- EPIC 1 (Dashboard - for navigation)
