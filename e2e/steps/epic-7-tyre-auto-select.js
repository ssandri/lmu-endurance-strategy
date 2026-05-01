const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// Background step: "I have a race {string} with:" is already defined in epic-3 steps.
// "the race has drivers:" is already defined in epic-3 steps.
// "I navigate to the strategy creation page" is already defined in epic-3 steps.
// "I click {string}" is already defined in epic-3 steps.
// "I should be on the strategy comparison page" is already defined in epic-3 steps.
// "the comparison table should include a {string} column" is already defined in epic-6 steps.
// "the tyre multiplicity select should not be visible" is already defined in epic-6 steps.
// "I have a race with only {int} available tyres" is already defined in epic-3 steps.
// "I have calculated strategy variants" is already defined in epic-3 steps.

async function getVariantRows(page) {
  await page.locator('.compare-table tbody tr').first().waitFor({ state: 'visible', timeout: 8000 });
  return page.locator('.compare-table tbody tr[data-testid^="variant-row"]').all();
}

// --- AC-2: No Feasibility column, all-infeasible message ---

Then('the comparison table should not have a {string} column', async function (columnName) {
  const header = this.page.locator('.compare-table th', { hasText: columnName });
  await expect(header).not.toBeVisible();
});

Then('I should see the all infeasible message', async function () {
  await expect(this.page.getByTestId('all-infeasible-message')).toBeVisible({ timeout: 5000 });
});

Then('a back to step 1 button is shown', async function () {
  await expect(this.page.getByTestId('back-to-step1')).toBeVisible();
});

// --- AC-3: Time saved vs Normal column ---

Then('the {string} time saved should be {string}', async function (variantName, expectedText) {
  const rows = await getVariantRows(this.page);
  for (const row of rows) {
    const text = await row.locator('.link-btn').textContent();
    if (text && text.trim() === variantName) {
      // columns: Variant(0), Total Laps(1), Pit Stops(2), Avg Pace(3),
      //          Time in pits(4), Time saved vs Normal(5), Tyre change every(6), Action(7)
      const cells = await row.locator('td').all();
      const timeSavedText = await cells[5].textContent();
      expect(timeSavedText.trim()).toBe(expectedText);
      return;
    }
  }
  throw new Error(`Variant "${variantName}" not found in compare table`);
});

Then('each variant row should show a tyre change frequency', async function () {
  const rows = await getVariantRows(this.page);
  for (const row of rows) {
    // columns: Variant(0), Total Laps(1), Pit Stops(2), Avg Pace(3),
    //          Time in pits(4), Time saved vs Normal(5), Tyre change every(6), Action(7)
    const cells = await row.locator('td').all();
    const tyreChangeText = await cells[6].textContent();
    expect(tyreChangeText.trim()).toMatch(/Every (stop|2nd stop|3rd stop)/);
  }
});

// --- AC-4: Changeover table alignment ---

Given('I have an active strategy for the race', async function () {
  const calcRes = await fetch(`${this.apiUrl}/api/strategies/${this.raceId}/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: this.cookie,
    },
    body: JSON.stringify({
      name: 'Test Strategy',
      fuelPerLap: 3.5,
      energyPerLap: 2.1,
      estimatedTotalLaps: 380,
    }),
  });

  if (!calcRes.ok) {
    throw new Error(`Failed to calculate strategy: ${await calcRes.text()}`);
  }

  const strategies = await calcRes.json();
  const strategyId = Array.isArray(strategies) ? strategies[0].id : strategies.id;

  const activateRes = await fetch(`${this.apiUrl}/api/strategies/${this.raceId}/activate/${strategyId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: this.cookie,
    },
  });

  if (!activateRes.ok) {
    throw new Error(`Failed to activate strategy: ${await activateRes.text()}`);
  }
});

Then('the changeover table should be visible', async function () {
  await expect(this.page.locator('.changeover-table')).toBeVisible({ timeout: 5000 });
});

Then('the changeover table should have the correct column headers', async function () {
  const table = this.page.locator('.changeover-table .stint-table');
  await expect(table).toBeVisible();
  const headers = ['#', 'Driver', 'Start Lap', 'End Lap', 'Wall Clock'];
  for (const header of headers) {
    await expect(table.locator('th', { hasText: header })).toBeVisible();
  }
});
