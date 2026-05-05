Feature: UI Redesign and Theming
  As a race engineer
  I want a consistent WEC/LMU-inspired dark theme
  So that the application looks professional and is comfortable to use during long race sessions

  Background:
    Given I am logged in as "engineer-theme@test.com"

  Scenario: Dark theme is applied to body background
    Given I am on the dashboard page
    Then the body background colour should be dark
    And the computed background of the body should be the base dark colour

  Scenario: Dark theme is applied to the header
    Given I am on the dashboard page
    Then the header should have a dark surface background

  Scenario: WEC red accent colour is used on primary buttons
    Given I am on the dashboard page
    Then primary buttons should use the WEC red accent colour

  Scenario: CSS custom property design token system exists
    Given I am on the dashboard page
    Then the CSS custom property "--color-accent" should be defined
    And the CSS custom property "--color-bg-base" should be defined
    And the CSS custom property "--color-text-primary" should be defined

  Scenario: Typography uses the Inter font family
    Given I am on the dashboard page
    Then the body font family should include "Inter"

  Scenario: Theme is consistent on the Race Creation page
    Given I navigate to the race creation page
    Then the page card should have a dark surface background
    And primary buttons should use the WEC red accent colour

  Scenario: Theme is consistent on the Strategy Creation page
    Given a race exists with name "Theme Test Race"
    And I navigate to the strategy creation page for that race
    Then the page card should have a dark surface background

  Scenario: Status badge renders with active variant styling
    Given a race exists with an active strategy
    And I am on the dashboard page
    Then the strategy badge with variant "active" should be visible
    And the active badge should use the success colour

  Scenario: Status badge renders with planned variant styling
    Given a race exists without an active strategy
    And I am on the dashboard page
    Then the strategy badge with variant "planned" should be visible

  Scenario: Driver timeline colours are distinct from WEC red
    Given a race exists with a strategy that has stints
    And I navigate to the race execution page for that race
    Then the timeline blocks should not use the WEC red colour "#e8001d"

  Scenario: Application is responsive at 1280px viewport width
    Given I am on the dashboard page
    When the viewport is set to 1280px wide
    Then the page layout should be visible without horizontal scrolling

  Scenario: No functional regression on login page
    Given I am not logged in
    Then the login page should render correctly
    And the login form should have email and password inputs
