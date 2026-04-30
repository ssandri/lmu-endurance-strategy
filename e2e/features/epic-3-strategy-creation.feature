Feature: Strategy Creation (Two-Step Flow)
  As a race engineer
  I want to calculate strategy variants and select one as the active race plan
  So that I have an optimal pit-stop plan for the race

  Background:
    Given I am logged in as "engineer@test.com"
    And I have a race "Le Mans 24h" with:
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

  # Step 1 — Configure & Calculate

  Scenario: Strategy form pre-fills from race parameters
    When I navigate to the strategy creation page
    Then the strategy fuel per lap should be "3.5"
    And the strategy energy per lap should be "2.1"
    And the estimated total laps should be "380"

  Scenario: Validation blocks calculation with invalid inputs
    When I navigate to the strategy creation page
    And I set estimated total laps to "380"
    And I set fuel per lap to "250"
    And I click "Calculate Strategy"
    Then I should see a validation error for fuel per lap

  Scenario: Calculate generates at least 3 variants
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should be on the strategy comparison page
    And I should see at least 3 strategy variants

  Scenario: Loading indicator during calculation
    When I navigate to the strategy creation page
    And I click "Calculate Strategy"
    Then I should see a loading indicator while calculating

  # Step 2 — Compare & Choose

  Scenario: Comparison table shows variant summary
    Given I have calculated strategy variants
    When I am on the strategy comparison page
    Then the comparison table should show columns:
      | Variant | Total Laps | Pit Stops | Avg Pace | Feasibility |

  Scenario: Expand variant shows stint-by-stint plan
    Given I have calculated strategy variants
    When I expand the "Normal Pace" variant
    Then I should see a stint table with columns:
      | # | Driver | Start Lap | End Lap | Fuel Load | Tyre Change | Est. Start | Pit Time |

  Scenario: Fuel Save variant shows per-driver targets
    Given I have calculated strategy variants
    When I expand the "Fuel Save" variant
    Then I should see fuel save targets per driver

  Scenario: Feasibility warning for insufficient tyres
    Given I have a race with only 4 available tyres
    And I have calculated strategy variants
    Then I should see a feasibility warning about tyre shortage

  Scenario: Activate a strategy variant
    Given I have calculated strategy variants
    When I click "Use this" on the "Normal Pace" variant
    Then I should be on the race execution page
    And the race should have an active strategy

  Scenario: Back button preserves form values
    Given I have calculated strategy variants
    When I click "Back to Step 1"
    Then the strategy form should retain my previous values
