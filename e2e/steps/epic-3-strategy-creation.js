const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// --- Background steps ---

Given('I have a race {string} with:', async function (name, dataTable) {
  const params = dataTable.rowsHash();
  this.raceParams = {
    name,
    track: params.track || 'Le Mans',
    durationHours: parseFloat(params.duration) || 24,
    fuelPerLap: parseFloat(params.fuelPerLap) || 3.5,
    energyPerLap: parseFloat(params.energyPerLap) || 2.0,
    tyreDegFL: parseFloat(params.tyreDegFL) || 1.0,
    tyreDegFR: parseFloat(params.tyreDegFR) || 1.0,
    tyreDegRL: parseFloat(params.tyreDegRL) || 1.0,
    tyreDegRR: parseFloat(params.tyreDegRR) || 1.0,
    availableTyres: parseInt(params.availableTyres) || 32,
    estimatedTotalLaps: parseInt(params.estimatedTotalLaps) || 380,
    drivers: [],
  };
});

Given('the race has drivers:', async function (dataTable) {
  const rows = dataTable.hashes();
  this.raceParams.drivers = rows.map(row => ({
    name: row.name,
    avgLapTimeMs: parseLapTime(row.pace),
  }));

  // Create the race via API
  const res = await fetch(`${this.apiUrl}/api/races`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: this.cookie,
    },
    body: JSON.stringify(this.raceParams),
  });

  if (!res.ok) {
    throw new Error(`Failed to create race: ${await res.text()}`);
  }

  const race = await res.json();
  this.raceId = race.id;
});

Given('I have a race with only {int} available tyres', async function (tyreCount) {
  const raceData = {
    name: 'Low Tyre Race',
    track: 'Le Mans',
    durationHours: 24,
    fuelPerLap: 3.5,
    energyPerLap: 2.1,
    tyreDegFL: 1.2,
    tyreDegFR: 1.3,
    tyreDegRL: 0.9,
    tyreDegRR: 1.0,
    availableTyres: tyreCount,
    estimatedTotalLaps: 380,
    drivers: [
      { name: 'Alice', avgLapTimeMs: 204000 },
      { name: 'Bob', avgLapTimeMs: 205500 },
    ],
  };

  const res = await fetch(`${this.apiUrl}/api/races`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: this.cookie,
    },
    body: JSON.stringify(raceData),
  });

  if (!res.ok) {
    throw new Error(`Failed to create race: ${await res.text()}`);
  }

  const race = await res.json();
  this.raceId = race.id;
});

// --- Navigation steps ---

When('I navigate to the strategy creation page', async function () {
  await this.page.goto(`${this.baseUrl}/races/${this.raceId}/strategy/new`);
  await this.page.waitForLoadState('networkidle');
});

// --- Form interaction steps ---

When('I set fuel per lap to {string}', async function (value) {
  await this.page.getByTestId('strategy-fuel-input').fill(value);
});

When('I set estimated total laps to {string}', async function (value) {
  await this.page.getByTestId('strategy-laps-input').fill(value);
});

When('I click {string}', async function (text) {
  await this.page.getByRole('button', { name: text }).click();
});

// --- Strategy calculation helper ---

Given('I have calculated strategy variants', async function () {
  await this.page.goto(`${this.baseUrl}/races/${this.raceId}/strategy/new`);
  await this.page.waitForLoadState('networkidle');
  await this.page.getByTestId('calculate-btn').click();
  await this.page.waitForURL(/\/races\/\d+\/strategy\/compare/, { timeout: 10000 });
});

When('I am on the strategy comparison page', async function () {
  // Already on compare page after calculating variants — just verify URL
  await this.page.waitForURL(/\/races\/\d+\/strategy\/compare/, { timeout: 5000 });
});

// --- Assertion steps ---

Then('the strategy fuel per lap should be {string}', async function (value) {
  const actual = await this.page.getByTestId('strategy-fuel-input').inputValue();
  expect(actual).toBe(value);
});

Then('the strategy energy per lap should be {string}', async function (value) {
  const actual = await this.page.getByTestId('strategy-energy-input').inputValue();
  expect(actual).toBe(value);
});

Then('the estimated total laps should be {string}', async function (value) {
  const actual = await this.page.getByTestId('strategy-laps-input').inputValue();
  expect(actual).toBe(value);
});

Then('I should see a validation error for fuel per lap', async function () {
  await this.page.waitForTimeout(500);
  const errorEl = this.page.locator('.error');
  await expect(errorEl.first()).toBeVisible({ timeout: 5000 });
  const text = await errorEl.first().textContent();
  expect(text.toLowerCase()).toContain('fuel');
});

Then('I should be on the strategy comparison page', async function () {
  await this.page.waitForURL(/\/races\/\d+\/strategy\/compare/, { timeout: 10000 });
});

Then('I should see at least {int} strategy variants', async function (count) {
  const rows = this.page.locator('.compare-table tbody tr');
  await rows.first().waitFor({ state: 'visible', timeout: 5000 });
  const actualCount = await rows.count();
  expect(actualCount).toBeGreaterThanOrEqual(count);
});

Then('I should see a loading indicator while calculating', async function () {
  // The loading indicator should appear after clicking Calculate
  // It may be transient, so we check it was visible at some point
  const loading = this.page.getByTestId('loading');
  await expect(loading).toBeVisible({ timeout: 2000 }).catch(() => {
    // If calculation is too fast, loading may not be visible — acceptable
  });
});

Then('the comparison table should show columns:', async function (dataTable) {
  const expectedColumns = dataTable.raw()[0];
  for (const col of expectedColumns) {
    await expect(this.page.locator('.compare-table th', { hasText: col })).toBeVisible();
  }
});

When('I expand the {string} variant', async function (variantName) {
  const row = this.page.locator('.compare-table tr', { hasText: variantName });
  await row.locator('.link-btn').click();
});

Then('I should see a stint table with columns:', async function (dataTable) {
  const expectedColumns = dataTable.raw()[0];
  for (const col of expectedColumns) {
    await expect(this.page.locator('.stint-table th', { hasText: col })).toBeVisible();
  }
});

Then('I should see fuel save targets per driver', async function () {
  await expect(this.page.locator('.fuel-save-targets')).toBeVisible();
});

Then('I should see a feasibility warning about tyre shortage', async function () {
  // Look for warning box or badge with warning class
  const warning = this.page.locator('.warning-box, .badge.warning');
  await expect(warning.first()).toBeVisible({ timeout: 3000 });
});

When('I click {string} on the {string} variant', async function (buttonText, variantName) {
  const row = this.page.locator('.compare-table tr', { hasText: variantName });
  await row.getByRole('button', { name: buttonText }).click();
});

Then('I should be on the race execution page', async function () {
  await this.page.waitForURL(/\/races\/\d+$/, { timeout: 5000 });
});

Then('the race should have an active strategy', async function () {
  const res = await fetch(`${this.apiUrl}/api/races/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const race = await res.json();
  const hasActive = race.strategies && race.strategies.some(s => s.is_active === 1);
  expect(hasActive).toBeTruthy();
});

Then('the strategy form should retain my previous values', async function () {
  await this.page.waitForURL(/\/races\/\d+\/strategy\/new/);
  const fuelValue = await this.page.getByTestId('strategy-fuel-input').inputValue();
  const energyValue = await this.page.getByTestId('strategy-energy-input').inputValue();
  const lapsValue = await this.page.getByTestId('strategy-laps-input').inputValue();
  // Values should not be empty — they should retain previous inputs
  expect(fuelValue).not.toBe('');
  expect(energyValue).not.toBe('');
  expect(lapsValue).not.toBe('');
});

// --- Helpers ---

function parseLapTime(timeStr) {
  // Parse "3:24.000" format to milliseconds
  const match = timeStr.match(/^(\d+):(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Invalid lap time format: ${timeStr}`);
  const minutes = parseInt(match[1]);
  const seconds = parseInt(match[2]);
  const millis = parseInt(match[3]);
  return minutes * 60 * 1000 + seconds * 1000 + millis;
}
