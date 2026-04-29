# LMU Endurance Strategy — Requirements & User Stories

## Overview

**LMU Endurance Strategy** is a web application for Le Mans Ultimate (LMU) endurance race engineers. It lets teams create races, plan pit-stop strategies, track live race execution stint by stint, and dynamically recalculate the remaining plan as conditions change.

---

## Actors

| Actor | Description |
|---|---|
| Race Engineer | Primary user. Manages race setup, strategy creation, and live execution tracking. |
| System | The application itself; performs calculations and persists data. |

---

## Epics & User Stories

---

### EPIC 1 — Race Management (Dashboard)

> **As a race engineer, I want to manage my list of endurance races so that I can access past and current race data quickly.**

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-01 | As a race engineer, I want to see all my races on a dashboard so that I can pick the one I need. | Dashboard lists every race as a card showing: name, track, duration, driver count, active strategy (yes/no), and event count. |
| US-02 | As a race engineer, I want to see a loading indicator while races are being fetched so that I know the page is working. | A spinner or loading state is visible until data arrives. |
| US-03 | As a race engineer, I want to see an empty state when no races exist so that I know how to get started. | Page shows an explanatory message and a "New Race" call-to-action when the list is empty. |
| US-04 | As a race engineer, I want to open a race from the dashboard so that I can view its execution page. | Clicking a race card navigates to the Race Execution page for that race. |
| US-05 | As a race engineer, I want to create a new race from the dashboard so that I can start tracking a new event. | A "New Race" button navigates to the race creation form. |
| US-06 | As a race engineer, I want to delete a race so that I can remove unwanted entries. | Clicking delete triggers a confirmation dialog; confirming removes the race and all associated data (drivers, stints, strategies, events). Cancelling leaves the race intact. |
| US-07 | As a race engineer, I want the dashboard to recover gracefully if the server fails so that I am not left with a blank screen. | An error message is shown if the race list cannot be loaded. |

---

### EPIC 2 — Race Creation

> **As a race engineer, I want to configure a new race with all its parameters so that strategy calculations are accurate from the start.**

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-10 | As a race engineer, I want a race name to be pre-filled as "Track – Date – N" so that naming is consistent without manual typing. | Name field defaults to `{track name} – {today's date} – 1` (suffix increments if a race with the same track and date already exists). The field remains editable. |
| US-11 | As a race engineer, I want to choose a track from a pre-loaded list so that the name is standardised. | A dropdown lists all supported LMU tracks plus "Other" with a free-text entry. Selecting a track updates the default race name. |
| US-12 | As a race engineer, I want to set the race duration in hours so that the system knows how long the event is. | Duration field defaults to **12 h**; any positive number is accepted. |
| US-13 | As a race engineer, I want to enter fuel consumption per lap so that fuel strategy is calculated correctly. | Fuel per lap field defaults to **0**; must be >= 0. |
| US-14 | As a race engineer, I want to enter energy consumption per lap so that energy limits are respected. | Energy per lap field defaults to **0**; must be 0–100. A system-level 0.1 % energy reserve is always enforced (reaching 0 % = DQ). |
| US-15 | As a race engineer, I want to enter tyre degradation per lap so that tyre-life constraints feed into stint length calculations. | Four tyre wear fields (FL, FR, RL, RR as % per lap) default to 0; values must be 0–100. |
| US-16 | As a race engineer, I want to enter each driver's average lap pace so that strategies are produced with realistic timing from day one. | One pace entry per driver in M:SS.mmm format beside the driver name; invalid formats are rejected inline. |
| US-17 | As a race engineer, I want to add multiple drivers by name so that stints are correctly attributed. | At least one driver row is shown; additional rows can be added; blank rows are ignored on save. |
| US-18 | As a race engineer, I want to specify the total available tyres so that the system can plan a feasible tyre rotation. | Available tyres field defaults to **32**. |
| US-19 | As a race engineer, I want to enter the estimated total laps for the race so that the strategy target is correct. | Estimated total laps field is required; value can be updated later during race execution. |
| US-20 | As a race engineer, I want the app to take me to the Strategy Creation flow immediately after saving the race so that I can define the plan without extra navigation. | After successful save the user lands on the **Strategy Creation – Step 1** page for that race. |

> **Note:** There are no manual pit-time fields. All pit stop durations are computed internally from the lookup tables in Appendix A.

---

### EPIC 3 — Strategy Creation (Two-Step Flow)

> **As a race engineer, I want to calculate strategy variants and select one as the active race plan, using a guided two-step flow.**

#### Step 1 — Configure & Calculate

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-30 | As a race engineer, I want to fill in strategy parameters so that the calculation reflects current conditions. | Input form collects: strategy name, race start time (wall clock), fuel/lap (pre-filled from race, editable), energy/lap (pre-filled, editable), tyre wear per corner (pre-filled, editable), and estimated total laps (pre-filled, editable). |
| US-31 | As a race engineer, I want the form to validate all inputs before calculating so that I don't receive a silently wrong plan. | Fuel 0–200 L, energy 0–100 %, tyre wear 0–100 % per corner, total laps > 0. Violations show inline warnings and block calculation. |
| US-32 | As a race engineer, I want to press "Calculate" and be taken to Step 2 automatically so that the flow feels seamless. | Clicking Calculate runs the strategy engine and, on success, advances to Step 2. A loading indicator is shown during calculation. |
| US-33 | As a race engineer, I want at least three strategy variants generated automatically (Normal Pace, Fuel Save, Mixed) so that I can compare trade-offs without manual re-runs. | Multi-variant engine produces named variants; each has a complete stint plan. |

#### Step 2 — Compare & Choose

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-34 | As a race engineer, I want to see a comparison table of all variants so that I can choose the best one at a glance. | Table shows: variant name, estimated total laps, number of pit stops, average pace, estimated race time, and feasibility warnings. |
| US-35 | As a race engineer, I want to expand any variant to see its full stint-by-stint plan so that I can review the details before committing. | Expanding a variant reveals: stint number, driver, start lap, end lap, fuel load, tyre change (yes/no), estimated start time, and computed pit time. |
| US-36 | As a race engineer, I want to see per-driver fuel-saving targets when reviewing a fuel-save variant so that drivers know their exact targets. | Per-driver target fuel/energy per lap and maximum pace loss are shown for fuel-saving variants only. |
| US-37 | As a race engineer, I want to see a feasibility warning when tyre supply is insufficient so that I can adjust before committing. | Warning displayed when required tyre sets exceed available stock. |
| US-38 | As a race engineer, I want to click "Use this strategy" on my preferred variant so that it becomes the active race plan and I am taken to the execution view. | Confirming a variant marks it as active and navigates to the **Race Execution** page. Only one variant can be active at a time. |
| US-39 | As a race engineer, I want a "Back" option so that I can return to Step 1 and adjust parameters without losing my inputs. | Back button on Step 2 returns to Step 1 with all field values intact. |

---

### EPIC 4 — Race Execution & Live Adjustments

> **As a race engineer, I want to track each stint in real time, confirm or correct what actually happened, and always have an up-to-date remaining strategy.**

#### Driver Order Management

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-50 | As a race engineer, I want to rearrange the driver rotation order before or during the race so that I can react to driver availability and team decisions. | A driver list with drag-and-drop (or up/down controls) allows reordering at any time. The new order is applied to future unconfirmed stints but does **not** trigger a strategy recalculation on its own (it only affects driver assignment, not timing or fuel). |

#### Stint Confirmation

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-51 | As a race engineer, I want to see the current and upcoming stints clearly so that I always know what the plan is. | Execution view shows: the currently running stint and the next 3–5 planned stints, each with driver, lap range, and estimated start time. |
| US-52 | As a race engineer, I want to confirm a stint ended exactly as planned so that the plan advances correctly. | A "Confirm as planned" action marks the stint completed at the laps specified in the strategy. |
| US-53 | As a race engineer, I want to confirm a stint ended on a different lap (shorter or longer than planned) so that the system knows actual race progress. | "Confirm with adjustment" allows entry of the actual end lap; the system recalculates all future stints from that point. |
| US-54 | As a race engineer, I want to record what happened during the pit stop so that actual pit time is tracked and future stints are accurate. | Pit stop confirmation form includes: **Energy added** (% of battery, defaults to enough to reach 99.1–99.9 % — i.e. fill to just below the reserve limit; reduced or zeroed only for unplanned stops caused by damage), **Fuel added** (% of tank, required — we always refuel), **Tyres changed** (0 / 1 / 2 / 3 / 4, defaults to 4 — may be forced e.g. flat tyre), and **Damage type** (None / Bodywork / Bodywork + Rear wing / Yellow suspension / Orange suspension / Red suspension). System calculates actual pit time from Appendix A and records it. |
| US-55 | As a race engineer, I want the strategy for all future stints to be recalculated automatically after each stint confirmation so that the plan always reflects reality. | After every confirmation the strategy engine replans from the confirmed lap forward, taking into account updated fuel level, energy level, tyre state, tyres remaining, and remaining race time. |

#### Estimated Total Laps Adjustment

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-56 | As a race engineer, I want to update the estimated total laps at any point during the race so that as the race nears its end the plan becomes more accurate. | An "Update estimated laps" control is always visible on the execution page; submitting a new value immediately triggers a strategy recalculation for all remaining stints. |

#### Recalculation Behaviour

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-57 | As a race engineer, I want recalculations to preserve already-confirmed stints so that historical data is never overwritten. | Only future (unconfirmed) stints are recalculated; past stints remain as recorded. |
| US-58 | As a race engineer, I want to see the revised stint table immediately after every recalculation so that the updated plan is always in front of me. | Execution view refreshes the remaining stints table within 2 s of any trigger (stint confirmation, laps update, driver reorder). |

---

### EPIC 5 — Race Schedule & Timeline

> **As a race engineer, I want a visual overview of the race plan so that I can communicate driver rotation and timing to the whole team.**

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-60 | As a race engineer, I want to see a timeline with colour-coded blocks per driver so that I can spot the rotation pattern instantly. | Timeline renders a proportionally-sized coloured block per stint; each driver has a distinct colour; a legend is shown. Confirmed stints are visually distinct from planned stints (e.g. filled vs. outlined). |
| US-61 | As a race engineer, I want a changeover table listing every stint with number, driver, start/end lap, and wall-clock start time so that pit crew timing boards can be prepared. | Rows appear in stint order; wall-clock times appear when a race start time was specified. |
| US-62 | As a race engineer, I want per-driver summary cards showing total stints, total laps (planned and confirmed), and estimated drive time so that driving-time fairness is clear. | One card per driver, updated after every recalculation. |
| US-63 | As a race engineer, I want the timeline to show "No strategy yet" when no active strategy exists. | Placeholder message displayed when no active strategy is found. |

---

## Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NF-01 | Data Integrity | Deleting a race must cascade-delete all related drivers, stints, strategies, and events. |
| NF-02 | Input Safety | Special characters in race names and driver names must be stored and displayed verbatim. |
| NF-03 | Authentication | All pages and API endpoints require an authenticated user session; unauthenticated requests redirect to the login page. |
| NF-04 | Energy Reserve | The energy reserve floor is fixed at 0.1 % (not configurable). Reaching 0 % is a disqualification in LMU. |
| NF-05 | Strategy Safety Caps | Total stints and total laps are capped at system-defined maximums to keep calculations performant. |
| NF-06 | API | A REST API exposes all operations for programmatic access and testing. |
| NF-07 | Pit Time | Pit stop time is **never entered manually**. It is computed internally from the lookup tables in Appendix A based on actual inputs (fuel %, tyres changed, damage type). |

---

## Data Model Summary

| Entity | Key Fields |
|---|---|
| Race | id, name, track, durationHours, fuelPerLap, energyPerLap, tyreDegFL/FR/RL/RR (%/lap), availableTyres, estimatedTotalLaps |
| Driver | id, raceId, name, avgLapTimeMs, rotationOrder |
| Stint | id, raceId, driverId, stintNumber, plannedStartLap, plannedEndLap, actualEndLap, confirmed, fuelAdded (%), tyresChanged (0–4), damageType, actualPitTimeSec, fuelLoad |
| Strategy | id, raceId, name, isActive, data (JSON blob of full stint plan) |
| RaceEvent | id, raceId, lap, type, details |

---

## Supported Tracks (pre-loaded in the creation form)

Bahrain International Endurance Circuit, Bahrain International Outer Circuit, Bahrain International Paddock Circuit, Circuit de Barcelona-Catalunya, Circuit de la Sarthe, Circuit de la Sarthe Mulsanne No Chicanes, Circuit Paul Ricard, COTA National, Fuji Classic Layout (No Chicane), Le Mans, Lusail International Circuit Short, Monza, Monza Curva Grande Layout, Nürburgring, Road Atlanta, Sebring, Sebring School Circuit, Silverstone, Spa Endurance Layout, Spa-Francorchamps, Suzuka, + **Other** (free text).

---

## Appendix A — Pit Time Lookup Tables

Pit stop time is calculated internally by summing three independent components.

### A1 — Refuel Time (by % of tank added)

Refuelling is mandatory on every pit stop. The system uses the *Estimated time* column; values between entries are linearly interpolated.

| Fuel added | Time (s) | | Fuel added | Time (s) | | Fuel added | Time (s) | | Fuel added | Time (s) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 % | 2.2 | | 26 % | 10.4 | | 51 % | 20.4 | | 76 % | 30.4 |
| 2 % | 2.4 | | 27 % | 10.8 | | 52 % | 20.8 | | 77 % | 30.8 |
| 3 % | 2.6 | | 28 % | 11.2 | | 53 % | 21.2 | | 78 % | 31.2 |
| 4 % | 2.8 | | 29 % | 11.6 | | 54 % | 21.6 | | 79 % | 31.6 |
| 5 % | 3.1 | | 30 % | 12.0 | | 55 % | 22.0 | | 80 % | 32.0 |
| 6 % | 3.3 | | 31 % | 12.4 | | 56 % | 22.4 | | 81 % | 32.4 |
| 7 % | 3.5 | | 32 % | 12.8 | | 57 % | 22.8 | | 82 % | 32.8 |
| 8 % | 3.7 | | 33 % | 13.2 | | 58 % | 23.2 | | 83 % | 33.2 |
| 9 % | 3.9 | | 34 % | 13.6 | | 59 % | 23.6 | | 84 % | 33.6 |
| 10 % | 4.1 | | 35 % | 14.0 | | 60 % | 24.0 | | 85 % | 34.0 |
| 11 % | 4.4 | | 36 % | 14.4 | | 61 % | 24.4 | | 86 % | 34.4 |
| 12 % | 4.8 | | 37 % | 14.8 | | 62 % | 24.8 | | 87 % | 34.8 |
| 13 % | 5.2 | | 38 % | 15.2 | | 63 % | 25.2 | | 88 % | 35.2 |
| 14 % | 5.6 | | 39 % | 15.6 | | 64 % | 25.6 | | 89 % | 35.6 |
| 15 % | 6.0 | | 40 % | 16.0 | | 65 % | 26.0 | | 90 % | 36.0 |
| 16 % | 6.4 | | 41 % | 16.4 | | 66 % | 26.4 | | 91 % | 36.4 |
| 17 % | 6.8 | | 42 % | 16.8 | | 67 % | 26.8 | | 92 % | 36.8 |
| 18 % | 7.2 | | 43 % | 17.2 | | 68 % | 27.2 | | 93 % | 37.2 |
| 19 % | 7.6 | | 44 % | 17.6 | | 69 % | 27.6 | | 94 % | 37.6 |
| 20 % | 8.0 | | 45 % | 18.0 | | 70 % | 28.0 | | 95 % | 38.0 |
| 21 % | 8.4 | | 46 % | 18.4 | | 71 % | 28.4 | | 96 % | 38.4 |
| 22 % | 8.8 | | 47 % | 18.8 | | 72 % | 28.8 | | 97 % | 38.8 |
| 23 % | 9.2 | | 48 % | 19.2 | | 73 % | 29.2 | | 98 % | 39.2 |
| 24 % | 9.6 | | 49 % | 19.6 | | 74 % | 29.6 | | 99 % | 39.6 |
| 25 % | 10.0 | | 50 % | 20.0 | | 75 % | 30.0 | | 100 % | 40.0 |

---

### A2 — Damage Repair Time

Added only when a damage type is selected. If the damage state is unknown, use the midpoint.

| Damage type | Additional time (s) |
|---|---|
| None | 0 |
| Bodywork only | 32.5 (range 30–35) |
| Bodywork + Rear wing | 60 |
| All damage — Yellow suspension | 32.5 (range 30–35) |
| All damage — Orange suspension | 110 |
| All damage — Red suspension | 180 |

---

### A3 — Tyre Change Time

Added only when one or more tyres are changed. A tyre change may be forced (e.g. flat tyre).

| Tyres changed | Additional time (s) |
|---|---|
| 0 | 0 |
| 1 | 5 |
| 2 | 5 |
| 3 | 12 |
| 4 | 12 |

---

### Total Pit Stop Time Formula

```
Total pit stop time (s) = Refuel time [A1] + Damage repair time [A2] + Tyre change time [A3]
```

The result is stored as `actualPitTimeSec` on the stint record and is used as input for all subsequent strategy recalculations.
