Feature: Improve Race Flow (Epic 6)
  As a race engineer
  I want estimated laps auto-derived, meaningful strategy variants, tyre multiplicity control,
  improved comparison data and pace formatting
  So that strategy creation requires less manual entry and comparison is more actionable

  Background:
    Given I am logged in as "engineer@test.com"
    And I have a race "Epic6 Test Race" with:
      | track              | Le Mans |
      | duration           | 24      |
      | fuelPerLap         | 3.5     |
      | energyPerLap       | 2.1     |
      | tyreDegFL          | 1.2     |
      | tyreDegFR          | 1.3     |
      | tyreDegRL          | 0.9     |
      | tyreDegRR          | 1.0     |
      | availableTyres     | 32      |
      | estimatedTotalLaps | 380     |
    And the race has drivers:
      | name    | pace     |
      | Alice   | 3:24.000 |
      | Bob     | 3:25.500 |
      | Charlie | 3:26.000 |

  # --- AC-1: Auto-calculate estimated total laps ---

  Scenario: Estimated laps field is pre-filled from driver paces
    When I navigate to the strategy creation page
    Then the estimated total laps should be "421"

  Scenario: Estimated laps field is editable after auto-derivation
    When I navigate to the strategy creation page
    And I set estimated total laps to "400"
    Then the estimated total laps should be "400"

  # --- AC-2: No redundant data re-entry ---

  Scenario: Strategy form pre-fills fuel and energy from race record
    When I navigate to the strategy creation page
    Then the strategy fuel per lap should be "3.5"
    And the strategy energy per lap should be "2.1"

  # --- AC-3: Variants produce different pit-stop profiles (fuel-limited race) ---

  Scenario: Fuel Save variant has fewer pit stops than Normal Pace
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the "Fuel Save" variant should have fewer pit stops than "Normal Pace"

  Scenario: Mixed variant pit stops are between Normal Pace and Fuel Save
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the "Mixed" variant should have fewer or equal pit stops than "Normal Pace"
    And the "Mixed" variant should have more or equal pit stops than "Fuel Save"

  Scenario: All three variants show different pit stop counts
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And at least two variants should have different pit stop counts

  # --- AC-4: Comparison table communicates meaningful differences ---

  Scenario: Comparison table has Time in pits column
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the comparison table should include a "Time in pits (est.)" column
    And the "Normal Pace" row should show a non-empty pit time value

  Scenario: All infeasible message is shown when no variants are feasible
    Given I have a race with only 4 available tyres
    And I have calculated strategy variants
    Then I should see a feasibility warning about tyre shortage

  Scenario: Fuel Save variant shows per-driver targets when expanded
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    When I expand the "Fuel Save" variant
    Then I should see fuel save targets per driver

  # --- AC-5: Tyre change every column in comparison table ---

  Scenario: Tyre change every column is shown in comparison table
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the comparison table should include a "Tyre change every" column

  Scenario: Tyre multiplicity selector is absent from strategy create form
    When I navigate to the strategy creation page
    Then the tyre multiplicity select should not be visible

  # --- AC-6: Pace formatting ---

  Scenario: Average pace is displayed in M:SS.mmm format
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the average pace for "Normal Pace" should be in "M:SS.mmm" format

  Scenario: Average pace has exactly 3 decimal places
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the "Normal Pace" avg pace should not contain raw millisecond values
