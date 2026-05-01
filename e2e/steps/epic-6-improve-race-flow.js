const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// Background step: "I have a race {string} with:" is already defined in epic-3 steps.
// "the race has drivers:" is also already defined in epic-3 steps.
// "I have a race with only {int} available tyres" is defined in epic-3 steps.
// "I navigate to the strategy creation page" is already defined in epic-3 steps.
// "I click {string}" is already defined in epic-3 steps.
// "I should be on the strategy comparison page" is already defined in epic-3 steps.
// "I have calculated strategy variants" is already defined in epic-3 steps.
// "I set estimated total laps to {string}" is already defined in epic-3 steps.
// "I set fuel per lap to {string}" is already defined in epic-3 steps.
// "the strategy fuel per lap should be {string}" is already defined in epic-3 steps.
// "the strategy energy per lap should be {string}" is already defined in epic-3 steps.
// "the estimated total laps should be {string}" is already defined in epic-3 steps.
// "I should see a feasibility warning about tyre shortage" is defined in epic-3 steps.
// "I expand the {string} variant" is already defined in epic-3 steps.
// "I should see fuel save targets per driver" is already defined in epic-3 steps.

// Shared helper: wait for compare table rows to be rendered and return them.
async function getVariantRows(page) {
  // Wait for at least the first row to be visible before collecting all
  await page.locator('.compare-table tbody tr').first().waitFor({ state: 'visible', timeout: 8000 });
  return page.locator('.compare-table tbody tr[data-testid^="variant-row"]').all();
}

// Shared helper: find a variant row by name and return the pit-stops count (cell index 2).
async function getPitStopsForVariant(page, name) {
  const allRows = await getVariantRows(page);
  for (const row of allRows) {
    const text = await row.locator('.link-btn').textContent();
    if (text && text.trim() === name) {
      const cells = await row.locator('td').all();
      // columns: Variant(0), Total Laps(1), Pit Stops(2), Avg Pace(3),
      //          Time in pits(4), Feasibility(5), Action(6)
      return parseInt((await cells[2].textContent()).trim());
    }
  }
  throw new Error(`Variant "${name}" not found in compare table`);
}

// --- AC-3: Variant pit-stop differentiation ---

Then('the {string} variant should have fewer pit stops than {string}', async function (variantA, variantB) {
  const pitStopsA = await getPitStopsForVariant(this.page, variantA);
  const pitStopsB = await getPitStopsForVariant(this.page, variantB);
  expect(pitStopsA).toBeLessThan(pitStopsB);
});

Then('the {string} variant should have fewer or equal pit stops than {string}', async function (variantA, variantB) {
  const pitStopsA = await getPitStopsForVariant(this.page, variantA);
  const pitStopsB = await getPitStopsForVariant(this.page, variantB);
  expect(pitStopsA).toBeLessThanOrEqual(pitStopsB);
});

Then('the {string} variant should have more or equal pit stops than {string}', async function (variantA, variantB) {
  const pitStopsA = await getPitStopsForVariant(this.page, variantA);
  const pitStopsB = await getPitStopsForVariant(this.page, variantB);
  expect(pitStopsA).toBeGreaterThanOrEqual(pitStopsB);
});

Then('at least two variants should have different pit stop counts', async function () {
  const rows = await getVariantRows(this.page);
  const pitStopCounts = [];
  for (const row of rows) {
    const cells = await row.locator('td').all();
    const pitStopsText = await cells[2].textContent();
    pitStopCounts.push(parseInt(pitStopsText.trim()));
  }
  const uniqueCounts = new Set(pitStopCounts);
  expect(uniqueCounts.size).toBeGreaterThan(1);
});

// --- AC-4: Time in pits column ---

Then('the comparison table should include a {string} column', async function (columnName) {
  await expect(this.page.locator('.compare-table th', { hasText: columnName })).toBeVisible();
});

Then('the {string} row should show a non-empty pit time value', async function (variantName) {
  const rows = await getVariantRows(this.page);
  for (const row of rows) {
    const text = await row.locator('.link-btn').textContent();
    if (text && text.trim() === variantName) {
      // pit time column is index 4: Variant(0), Total Laps(1), Pit Stops(2), Avg Pace(3), Time in pits(4)
      const cells = await row.locator('td').all();
      const pitTimeText = await cells[4].textContent();
      expect(pitTimeText.trim()).not.toBe('—');
      expect(pitTimeText.trim()).not.toBe('');
      return;
    }
  }
  throw new Error(`Variant "${variantName}" not found`);
});


// --- AC-5: Tyre multiplicity selector removed, tyre change every column added ---

Then('the tyre multiplicity select should not be visible', async function () {
  const select = this.page.getByTestId('tyre-multiplicity-select');
  await expect(select).not.toBeVisible();
});

// --- AC-6: Pace formatting ---

Then('the average pace for {string} should be in {string} format', async function (variantName, _format) {
  const rows = await getVariantRows(this.page);
  for (const row of rows) {
    const text = await row.locator('.link-btn').textContent();
    if (text && text.trim() === variantName) {
      // avg pace column is index 3: Variant(0), Total Laps(1), Pit Stops(2), Avg Pace(3)
      const cells = await row.locator('td').all();
      const paceText = await cells[3].textContent();
      // M:SS.mmm format: digit(s):2-digit.3-digit
      expect(paceText.trim()).toMatch(/^\d+:\d{2}\.\d{3}$/);
      return;
    }
  }
  throw new Error(`Variant "${variantName}" not found`);
});

Then('the {string} avg pace should not contain raw millisecond values', async function (variantName) {
  const rows = await getVariantRows(this.page);
  for (const row of rows) {
    const text = await row.locator('.link-btn').textContent();
    if (text && text.trim() === variantName) {
      const cells = await row.locator('td').all();
      const paceText = await cells[3].textContent();
      // Raw ms would be a large number like 205166.666... or 205167
      // A correctly formatted pace looks like "3:25.167"
      expect(paceText.trim()).not.toMatch(/^\d{5,}/);
      expect(paceText.trim()).toMatch(/^\d+:\d{2}\.\d{3}$/);
      return;
    }
  }
  throw new Error(`Variant "${variantName}" not found`);
});
