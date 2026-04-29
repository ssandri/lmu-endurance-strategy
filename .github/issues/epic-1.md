## Description
Build the race dashboard where engineers manage their list of endurance races.

## User Stories
- US-01: Dashboard lists every race as a card (name, track, duration, driver count, active strategy, event count)
- US-02: Loading indicator while races are being fetched
- US-03: Empty state with "New Race" CTA when no races exist
- US-04: Clicking a race card navigates to Race Execution page
- US-05: "New Race" button navigates to race creation form
- US-06: Delete race with confirmation dialog (cascade deletes all associated data)
- US-07: Error message shown if race list cannot be loaded

## Acceptance Criteria
- [ ] GET `/api/races` returns all races for the authenticated user with driver_count, has_active_strategy, event_count
- [ ] DELETE `/api/races/:id` cascade-deletes drivers, stints, strategies, events (NF-01)
- [ ] Dashboard shows loading spinner while fetching
- [ ] Dashboard shows empty state with CTA when no races
- [ ] Dashboard shows error state on API failure
- [ ] Race cards display: name, track, duration, driver count, strategy status, event count
- [ ] Clicking card navigates to `/races/:id`
- [ ] Delete button shows confirmation dialog before deleting
- [ ] Special characters in race names display correctly (NF-02)

## Dependencies
- EPIC 0 (Project Setup)
