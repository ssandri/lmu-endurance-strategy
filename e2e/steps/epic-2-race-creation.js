const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('I am on the race creation page', async function () {
  await this.page.goto(`${this.baseUrl}/races/new`);
  await this.page.waitForLoadState('networkidle');
  await this.page.getByTestId('race-create-page').waitFor({ state: 'visible', timeout: 5000 });
});

When('I select track {string}', async function (track) {
  await this.page.getByTestId('track-select').selectOption(track);
});

When('I enter custom track name {string}', async function (name) {
  await this.page.getByTestId('custom-track-input').fill(name);
});

When('I add a driver {string} with pace {string}', async function (name, pace) {
  const rows = await this.page.locator('[data-testid^="driver-name-"]').count();
  const lastIndex = rows - 1;
  const lastNameInput = this.page.getByTestId(`driver-name-${lastIndex}`);
  const lastValue = await lastNameInput.inputValue();

  if (lastValue !== '') {
    await this.page.getByTestId('add-driver-btn').click();
    const newIndex = rows;
    await this.page.getByTestId(`driver-name-${newIndex}`).fill(name);
    if (pace) await this.page.getByTestId(`driver-pace-${newIndex}`).fill(pace);
  } else {
    await lastNameInput.fill(name);
    if (pace) await this.page.getByTestId(`driver-pace-${lastIndex}`).fill(pace);
  }
});

When('I clear all driver names', async function () {
  const count = await this.page.locator('[data-testid^="driver-name-"]').count();
  for (let i = 0; i < count; i++) {
    await this.page.getByTestId(`driver-name-${i}`).fill('');
  }
});

When('I leave estimated total laps empty', async function () {
  // Field removed from race creation form — no-op
});

When('I submit the form', async function () {
  await this.page.getByTestId('submit-race-btn').click();
});

When('I fill in valid race parameters:', async function (dataTable) {
  const params = Object.fromEntries(dataTable.hashes().map(r => [r.field, r.value]));
  if (params.track) await this.page.getByTestId('track-select').selectOption(params.track);
  if (params.duration) await this.page.getByTestId('duration-input').fill(params.duration);
  if (params.fuelPerLap) await this.page.getByTestId('fuel-per-lap-input').fill(params.fuelPerLap);
  if (params.energyPerLap) await this.page.getByTestId('energy-per-lap-input').fill(params.energyPerLap);
  if (params.tyreDegFL) await this.page.getByTestId('tyre-deg-fl-input').fill(params.tyreDegFL);
  if (params.tyreDegFR) await this.page.getByTestId('tyre-deg-fr-input').fill(params.tyreDegFR);
  if (params.tyreDegRL) await this.page.getByTestId('tyre-deg-rl-input').fill(params.tyreDegRL);
  if (params.tyreDegRR) await this.page.getByTestId('tyre-deg-rr-input').fill(params.tyreDegRR);
  if (params.availableTyres) await this.page.getByTestId('available-tyres-input').fill(params.availableTyres);
});

When('I fill in the required fields', async function () {
  // No extra fields needed — just ensure track and duration are set (defaults are fine)
});

Then('the race name should contain {string}', async function (text) {
  const value = await this.page.getByTestId('race-name-input').inputValue();
  expect(value).toContain(text);
});

Then("the race name should contain today's date", async function () {
  const today = new Date().toISOString().slice(0, 10);
  const value = await this.page.getByTestId('race-name-input').inputValue();
  expect(value).toContain(today);
});

Then('the duration should be {string}', async function (value) {
  const actual = await this.page.getByTestId('duration-input').inputValue();
  expect(actual).toBe(value);
});

Then('the fuel per lap should be {string}', async function (value) {
  const actual = await this.page.getByTestId('fuel-per-lap-input').inputValue();
  expect(actual).toBe(value);
});

Then('the energy per lap should be {string}', async function (value) {
  const actual = await this.page.getByTestId('energy-per-lap-input').inputValue();
  expect(actual).toBe(value);
});

Then('all tyre degradation fields should be {string}', async function (value) {
  for (const corner of ['fl', 'fr', 'rl', 'rr']) {
    const actual = await this.page.getByTestId(`tyre-deg-${corner}-input`).inputValue();
    expect(actual).toBe(value);
  }
});

Then('the available tyres should be {string}', async function (value) {
  const actual = await this.page.getByTestId('available-tyres-input').inputValue();
  expect(actual).toBe(value);
});

Then('I should see {int} driver rows', async function (count) {
  const rows = await this.page.locator('[data-testid^="driver-name-"]').count();
  expect(rows).toBe(count);
});

Then('I should see a validation error for lap time format', async function () {
  await expect(this.page.locator('.field-error', { hasText: 'Invalid format' })).toBeVisible();
});

Then('I should see a validation error {string}', async function (text) {
  await expect(this.page.getByText(text)).toBeVisible();
});

Then('I should see a validation error for estimated total laps', async function () {
  await expect(this.page.locator('.field-error')).toBeVisible();
});

Then('I should be on the strategy creation page', async function () {
  await this.page.waitForURL(/\/races\/\d+\/strategy\/new/);
});

Then('the race should have {int} driver(s)', async function (count) {
  // Verify via API
  const res = await fetch(`${this.apiUrl}/api/races`, {
    headers: { Cookie: this.cookie },
  });
  const races = await res.json();
  const latest = races[0];
  const raceRes = await fetch(`${this.apiUrl}/api/races/${latest.id}`, {
    headers: { Cookie: this.cookie },
  });
  const race = await raceRes.json();
  expect(race.drivers.length).toBe(count);
});
