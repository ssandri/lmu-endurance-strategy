Feature: Registration Code Gate
  As a race engineer
  I want registration to require a secret code
  So that only authorized users can create accounts

  Scenario: Login form has no registration code field
    Given I am on the login page
    Then I should not see a registration code input

  Scenario: Register form shows registration code field
    Given I am on the login page
    When I switch to register mode
    Then I should see a registration code input

  Scenario: Successful registration with correct code
    Given I am on the login page
    When I switch to register mode
    And I fill in the registration form with email "newuser8@test.com", password "securepass", and code "testcode"
    And I submit the registration form
    Then I should be redirected to the dashboard

  Scenario: Registration rejected with wrong code
    Given I am on the login page
    When I switch to register mode
    And I fill in the registration form with email "badcode@test.com", password "securepass", and code "wrongcode"
    And I submit the registration form
    Then I should see an error message on the form

  Scenario: Registration code field is required before submission
    Given I am on the login page
    When I switch to register mode
    Then I should see a registration code input

  Scenario: Login form is unchanged after switching back from register
    Given I am on the login page
    When I switch to register mode
    And I switch back to login mode
    Then I should not see a registration code input
