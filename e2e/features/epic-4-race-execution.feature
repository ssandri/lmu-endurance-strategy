Feature: Race Execution & Live Adjustments
  As a race engineer
  I want to track each stint in real time and have an up-to-date remaining strategy
  So that I can make informed decisions during the race

  Background:
    Given I am logged in as "engineer@test.com"
    And I have a race "Spa 6h" with an active strategy
    And the strategy has the following planned stints:
      | stint | driver  | startLap | endLap |
      | 1     | Alice   | 1        | 28     |
      | 2     | Bob     | 29       | 56     |
      | 3     | Charlie | 57       | 84     |
      | 4     | Alice   | 85       | 112    |
      | 5     | Bob     | 113      | 140    |

  # Stint Display

  Scenario: Current and upcoming stints are visible
    When I navigate to the race execution page
    Then I should see stint 1 as the current stint
    And I should see the next 4 upcoming stints
    And each stint should show driver name, lap range, and estimated start time

  # Stint Confirmation

  Scenario: Confirm stint as planned
    When I navigate to the race execution page
    And I click "Confirm Stint" on stint 1
    And I confirm with default values
    Then stint 1 should be marked as completed
    And stint 2 should become the current stint

  Scenario: Confirm stint with adjusted end lap
    When I navigate to the race execution page
    And I click "Confirm Stint" on stint 1
    And I set actual end lap to 25
    And I set fuel added to 80
    And I confirm the stint
    Then stint 1 should show actual end lap 25
    And all future stints should be recalculated from lap 26

  Scenario: Pit stop form has correct defaults
    When I navigate to the race execution page
    And I click "Confirm Stint" on stint 1
    Then the pit stop form should show:
      | field         | default |
      | energyAdded   | 99.5    |
      | fuelAdded     | 100     |
      | tyresChanged  | 4       |
      | damageType    | None    |

  Scenario: Pit time is calculated not entered manually
    When I confirm stint 1 with:
      | fuelAdded    | 80        |
      | tyresChanged | 4         |
      | damageType   | bodywork  |
    Then the recorded pit time should be the sum of:
      | component   | value |
      | refuel 80%  | 32.0  |
      | damage      | 32.5  |
      | tyres 4     | 12.0  |

  Scenario: Damage types affect pit time correctly
    When I confirm stint 1 with damage "red_suspension"
    Then the pit time should include 180 seconds for damage repair

  # Recalculation

  Scenario: Future stints recalculated after confirmation
    When I confirm stint 1 ending on lap 25 instead of 28
    Then stints 2 onwards should be recalculated
    And the total number of stints may change
    And confirmed stint 1 should remain unchanged

  Scenario: Confirmed stints are never modified
    When I confirm stint 1 and then confirm stint 2
    Then stint 1 data should be identical to when it was first confirmed

  # Estimated Laps Update

  Scenario: Update estimated total laps triggers recalculation
    When I navigate to the race execution page
    And I update estimated total laps to 150
    Then all unconfirmed stints should be recalculated for 150 total laps

  # Driver Order

  Scenario: Reorder driver rotation
    When I navigate to the race execution page
    And I move driver "Charlie" to position 1
    Then future unconfirmed stints should reflect the new driver order
    And confirmed stints should remain unchanged
