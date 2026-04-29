Feature: Race Schedule & Timeline
  As a race engineer
  I want a visual overview of the race plan
  So that I can communicate driver rotation and timing to the whole team

  Background:
    Given I am logged in as "engineer@test.com"

  Scenario: No strategy placeholder
    Given I have a race "Monza Test" with no active strategy
    When I navigate to the race execution page
    Then I should see "No active strategy yet"

  Scenario: Timeline shows colour-coded blocks per driver
    Given I have a race with an active strategy and 3 drivers
    When I navigate to the race execution page
    Then I should see a timeline with colour-coded blocks
    And each driver should have a distinct colour
    And a legend should map colours to driver names

  Scenario: Confirmed stints are visually distinct from planned
    Given I have a race with 2 confirmed stints and 3 planned stints
    When I navigate to the race execution page
    Then confirmed stint blocks should appear filled/solid
    And planned stint blocks should appear faded/outlined

  Scenario: Timeline blocks are proportional to stint length
    Given I have a race with stints of different lengths:
      | stint | laps |
      | 1     | 30   |
      | 2     | 15   |
      | 3     | 30   |
    When I navigate to the race execution page
    Then stint 2 block should be approximately half the width of stint 1

  Scenario: Changeover table lists all stints
    Given I have a race with an active strategy and a start time of "14:00"
    When I navigate to the race execution page
    Then the changeover table should show all stints with:
      | column          |
      | stint number    |
      | driver          |
      | start lap       |
      | end lap         |
      | wall-clock time |

  Scenario: Per-driver summary cards
    Given I have a race with an active strategy
    When I navigate to the race execution page
    Then I should see a summary card for each driver showing:
      | field           |
      | total stints    |
      | planned laps    |
      | confirmed laps  |
      | est. drive time |

  Scenario: Timeline updates after recalculation
    Given I have a race with an active strategy
    When I confirm a stint with an adjusted end lap
    Then the timeline should update to reflect the recalculated plan
