Feature: UX Improvements — Tyre Auto-Select & Comparison Table (Epic 7)
  As a race engineer
  I want tyre change frequency to be system-driven, infeasible variants hidden,
  and the comparison table to show time-saved and tyre-change columns
  So that strategy selection is faster and more informative

  Background:
    Given I am logged in as "engineer@test.com"
    And I have a race "Epic7 Test Race" with:
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

  # --- AC-1: No manual tyre change frequency selector ---

  Scenario: Tyre multiplicity selector is absent from Step 1 form
    When I navigate to the strategy creation page
    Then the tyre multiplicity select should not be visible

  # --- AC-2: Infeasible variants hidden ---

  Scenario: No Feasibility column in comparison table
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the comparison table should not have a "Feasibility" column

  Scenario: All infeasible message shown when no strategy is possible
    Given I have a race with only 4 available tyres
    And I have calculated strategy variants
    Then I should see the all infeasible message
    And a back to step 1 button is shown

  # --- AC-3: Time saved vs Normal and Tyre change every columns ---

  Scenario: Comparison table has Time saved vs Normal column
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the comparison table should include a "Time saved vs Normal" column

  Scenario: Normal Pace row shows dash for time saved
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the "Normal Pace" time saved should be "—"

  Scenario: Comparison table has Tyre change every column
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And the comparison table should include a "Tyre change every" column

  Scenario: Each variant shows a tyre change frequency value
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And each variant row should show a tyre change frequency

  # --- AC-4: Changeover table alignment ---

  Scenario: Changeover table is present on race execution page
    Given I have an active strategy for the race
    When I navigate to the race execution page
    Then the changeover table should be visible
    And the changeover table should have the correct column headers
