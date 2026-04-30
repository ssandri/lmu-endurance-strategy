Feature: Race Management Dashboard
  As a race engineer
  I want to manage my list of endurance races
  So that I can access past and current race data quickly

  Background:
    Given I am logged in as "engineer@test.com"

  Scenario: Empty dashboard shows call to action
    Given I have no races
    When I navigate to the dashboard
    Then I should see "No races yet"
    And I should see a "New Race" button

  Scenario: Dashboard displays race cards
    Given I have the following races:
      | name              | track                  | duration | drivers | strategy |
      | Le Mans Practice  | Circuit de la Sarthe   | 24       | 3       | active   |
      | Spa Test          | Spa-Francorchamps      | 6        | 2       | none     |
    When I navigate to the dashboard
    Then I should see at least 2 race cards
    And the race card "Le Mans Practice" should show:
      | field          | value                |
      | track          | Circuit de la Sarthe |
      | duration       | 24h                  |
      | drivers        | 3 drivers            |

  Scenario: Loading state while fetching races
    Given the API is slow to respond
    When I navigate to the dashboard
    Then I should see a loading indicator

  Scenario: Error state when API fails
    Given the API returns an error
    When I navigate to the dashboard
    Then I should see an error message

  Scenario: Navigate to race creation
    Given I have no races
    When I navigate to the dashboard
    And I click the "New Race" button
    Then I should be on the race creation page

  Scenario: Navigate to race execution
    Given I have the following races:
      | name         | track             | duration | drivers | strategy |
      | Spa Enduro   | Spa-Francorchamps | 6        | 2       | active   |
    When I navigate to the dashboard
    And I click the race card "Spa Enduro"
    Then I should be on the race execution page for "Spa Enduro"

  Scenario: Delete a race with confirmation
    Given I have the following races:
      | name         | track   | duration | drivers | strategy |
      | Old Race     | Monza   | 4        | 1       | none     |
    When I navigate to the dashboard
    And I click delete on race "Old Race"
    And I confirm the deletion
    Then I should not see the race card "Old Race"
    And the race "Old Race" should be deleted from the database

  Scenario: Cancel race deletion
    Given I have the following races:
      | name         | track   | duration | drivers | strategy |
      | Keep Race    | Monza   | 4        | 1       | none     |
    When I navigate to the dashboard
    And I click delete on race "Keep Race"
    And I cancel the deletion
    Then I should still see the race card "Keep Race"

  Scenario: Special characters in race names
    Given I have the following races:
      | name                    | track   | duration | drivers | strategy |
      | Nürburgring <Test> #1  | Nürburgring | 8   | 2       | none     |
    When I navigate to the dashboard
    Then the race card should display "Nürburgring <Test> #1" verbatim
