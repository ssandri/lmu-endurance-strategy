Feature: Race Creation
  As a race engineer
  I want to configure a new race with all its parameters
  So that strategy calculations are accurate from the start

  Background:
    Given I am logged in as "engineer@test.com"
    And I am on the race creation page

  Scenario: Default race name is pre-filled from track and date
    When I select track "Le Mans"
    Then the race name should contain "Le Mans"
    And the race name should contain today's date

  Scenario: Race name updates when track changes
    Given the race name is "Le Mans – 2026-04-29 – 1"
    When I select track "Spa-Francorchamps"
    Then the race name should contain "Spa-Francorchamps"

  Scenario: Custom track via "Other" option
    When I select track "Other"
    And I enter custom track name "My Custom Track"
    Then the race name should contain "My Custom Track"

  Scenario: Default field values
    Then the duration should be "12"
    And the fuel per lap should be "0"
    And the energy per lap should be "0"
    And all tyre degradation fields should be "0"
    And the available tyres should be "32"

  Scenario: Add multiple drivers
    When I add a driver "Alice" with pace "1:54.500"
    And I add a driver "Bob" with pace "1:55.200"
    And I add a driver "Charlie" with pace "1:56.000"
    Then I should see 3 driver rows

  Scenario: Invalid lap time format rejected
    When I add a driver "Alice" with pace "invalid"
    And I submit the form
    Then I should see a validation error for lap time format

  Scenario: At least one driver required
    When I clear all driver names
    And I submit the form
    Then I should see a validation error "At least one driver is required"

  Scenario: Estimated total laps required
    When I add a driver "Alice" with pace "1:54.500"
    And I leave estimated total laps empty
    And I submit the form
    Then I should see a validation error for estimated total laps

  Scenario: Successful race creation navigates to strategy
    When I fill in valid race parameters:
      | field               | value              |
      | track               | Le Mans            |
      | duration            | 24                 |
      | fuelPerLap          | 3.5                |
      | energyPerLap        | 2.1                |
      | tyreDegFL           | 1.2                |
      | tyreDegFR           | 1.3                |
      | tyreDegRL           | 0.9                |
      | tyreDegRR           | 1.0                |
      | availableTyres      | 32                 |
      | estimatedTotalLaps  | 380                |
    And I add a driver "Alice" with pace "3:24.000"
    And I submit the form
    Then I should be on the strategy creation page

  Scenario: Blank driver rows are ignored
    When I add a driver "Alice" with pace "1:54.500"
    And I add a driver "" with pace ""
    And I fill in the required fields
    And I submit the form
    Then the race should have 1 driver
