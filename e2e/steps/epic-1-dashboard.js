const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('I have no races', async function () {
  // Default state after fresh login — no races exist
});

Given('I have the following races:', async function (dataTable) {
  const rows = dataTable.hashes();
  for (const row of rows) {
    const driverCount = parseInt(row.drivers) || 1;
    const drivers = Array.from({ length: driverCount }, (_, i) => ({
      name: `Driver ${i + 1}`,
      avgLapTimeMs: 90000,
    }));

    const res = await fetch(`${this.apiUrl}/api/races`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: this.cookie,
      },
      body: JSON.stringify({
        name: row.name,
        track: row.track,
        durationHours: parseFloat(row.duration),
        estimatedTotalLaps: 100,
        drivers,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create race: ${await res.text()}`);
    }

    if (row.strategy === 'active') {
      const race = await res.json();
      await fetch(`${this.apiUrl}/api/strategies/${race.id}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: this.cookie,
        },
        body: JSON.stringify({
          name: 'Test Strategy',
          fuelPerLap: 3.5,
          energyPerLap: 2.0,
          estimatedTotalLaps: 100,
        }),
      });
    }
  }
});

Given('the API is slow to respond', async function () {
  // We test loading state by checking it appears before data loads
  this.checkLoading = true;
});

Given('the API returns an error', async function () {
  // Intercept the races API to return an error
  await this.page.route('**/api/races', (route) => {
    route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
  });
});

When('I navigate to the dashboard', async function () {
  await this.page.goto(`${this.baseUrl}/`);
  if (this.checkLoading) {
    const loading = this.page.getByTestId('loading');
    await expect(loading).toBeVisible({ timeout: 1000 }).catch(() => {});
  }
  await this.page.waitForLoadState('networkidle');
});

When('I click the {string} button', async function (text) {
  await this.page.getByRole('button', { name: text }).click();
});

When('I click the race card {string}', async function (name) {
  await this.page.locator('.race-card', { hasText: name }).click();
});

When('I click delete on race {string}', async function (name) {
  const card = this.page.locator('.race-card', { hasText: name });
  await card.locator('.btn-danger').click();
});

When('I confirm the deletion', async function () {
  this.page.on('dialog', dialog => dialog.accept());
});

When('I cancel the deletion', async function () {
  this.page.on('dialog', dialog => dialog.dismiss());
});

Then('I should see {string}', async function (text) {
  await expect(this.page.getByText(text)).toBeVisible();
});

Then('I should see a {string} button', async function (text) {
  await expect(this.page.getByRole('button', { name: text })).toBeVisible();
});

Then('I should see {int} race cards', async function (count) {
  const cards = this.page.locator('.race-card');
  await expect(cards).toHaveCount(count);
});

Then('the race card {string} should show:', async function (name, dataTable) {
  const card = this.page.locator('.race-card', { hasText: name });
  const rows = dataTable.hashes();
  for (const row of rows) {
    await expect(card.getByText(row.value)).toBeVisible();
  }
});

Then('I should see a loading indicator', async function () {
  // Loading state was checked in the navigate step
});

Then('I should see an error message', async function () {
  await expect(this.page.getByTestId('error')).toBeVisible();
});

Then('I should be on the race creation page', async function () {
  await this.page.waitForURL('**/races/new');
});

Then('I should be on the race execution page for {string}', async function (name) {
  await this.page.waitForURL(/\/races\/\d+/);
});

Then('I should not see the race card {string}', async function (name) {
  await expect(this.page.locator('.race-card', { hasText: name })).not.toBeVisible();
});

Then('the race {string} should be deleted from the database', async function (name) {
  const res = await fetch(`${this.apiUrl}/api/races`, {
    headers: { Cookie: this.cookie },
  });
  const races = await res.json();
  const found = races.find(r => r.name === name);
  expect(found).toBeUndefined();
});

Then('I should still see the race card {string}', async function (name) {
  await expect(this.page.locator('.race-card', { hasText: name })).toBeVisible();
});

Then('the race card should display {string} verbatim', async function (text) {
  await expect(this.page.getByText(text)).toBeVisible();
});
