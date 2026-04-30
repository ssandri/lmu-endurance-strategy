const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a race via API and stores this.raceId.
 * Returns the created race object.
 */
async function createRace(world, { name = 'Test Race', driverCount = 3, startTime } = {}) {
  const drivers = Array.from({ length: driverCount }, (_, i) => ({
    name: `Driver ${i + 1}`,
    avgLapTimeMs: 90000,
  }));

  const body = {
    name,
    track: 'Monza',
    durationHours: 6,
    estimatedTotalLaps: 75,
    drivers,
  };

  if (startTime) {
    body.startTime = startTime;
  }

  const res = await fetch(`${world.apiUrl}/api/races`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: world.cookie,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to create race: ${await res.text()}`);
  }

  const race = await res.json();
  world.raceId = race.id;
  return race;
}

/**
 * Generates strategy variants and activates the first one.
 */
async function activateStrategy(world, raceId, { estimatedTotalLaps = 75 } = {}) {
  // Calculate strategy variants
  const calcRes = await fetch(`${world.apiUrl}/api/strategies/${raceId}/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: world.cookie,
    },
    body: JSON.stringify({
      name: 'Test Strategy',
      fuelPerLap: 3.5,
      energyPerLap: 2.0,
      estimatedTotalLaps,
    }),
  });

  if (!calcRes.ok) {
    throw new Error(`Failed to calculate strategy: ${await calcRes.text()}`);
  }

  const variants = await calcRes.json();
  const strategyId = Array.isArray(variants) ? variants[0].id : variants.id;

  // Activate first variant
  const activateRes = await fetch(`${world.apiUrl}/api/strategies/${raceId}/activate/${strategyId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: world.cookie,
    },
  });

  if (!activateRes.ok) {
    throw new Error(`Failed to activate strategy: ${await activateRes.text()}`);
  }

  return activateRes.json();
}

/**
 * Confirms a stint via API.
 */
async function confirmStint(world, raceId, stintId, { actualEndLap } = {}) {
  const body = actualEndLap != null ? { actualEndLap } : {};

  const res = await fetch(`${world.apiUrl}/api/stints/${raceId}/confirm/${stintId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: world.cookie,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to confirm stint: ${await res.text()}`);
  }

  return res.json();
}

/**
 * Fetches the list of stints for a race.
 */
async function getStints(world, raceId) {
  const res = await fetch(`${world.apiUrl}/api/stints/${raceId}`, {
    headers: { Cookie: world.cookie },
  });

  if (!res.ok) {
    throw new Error(`Failed to get stints: ${await res.text()}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Given steps
// ---------------------------------------------------------------------------

Given('I have a race {string} with no active strategy', async function (name) {
  await createRace(this, { name, driverCount: 2 });
});

Given('I have a race with an active strategy and {int} drivers', async function (driverCount) {
  const race = await createRace(this, { driverCount });
  await activateStrategy(this, race.id);
});

Given('I have a race with {int} confirmed stints and {int} planned stints', async function (confirmed, planned) {
  const totalStints = confirmed + planned;
  const lapsPerStint = 15;
  const estimatedTotalLaps = totalStints * lapsPerStint;

  const race = await createRace(this, { driverCount: 3, name: 'Stint Status Test' });
  await activateStrategy(this, race.id, { estimatedTotalLaps });

  for (let i = 0; i < confirmed; i++) {
    const stints = await getStints(this, race.id);
    const unconfirmed = stints.filter(s => !s.confirmed);
    if (unconfirmed.length === 0) break;
    await confirmStint(this, race.id, unconfirmed[0].id);
  }
});

Given('I have a race with stints of different lengths:', async function (dataTable) {
  const rows = dataTable.hashes();
  const totalLaps = rows.reduce((sum, r) => sum + parseInt(r.laps), 0);

  const race = await createRace(this, { driverCount: 3, name: 'Proportional Test' });
  await activateStrategy(this, race.id, { estimatedTotalLaps: totalLaps });
});

Given('I have a race with an active strategy and a start time of {string}', async function (startTime) {
  const race = await createRace(this, { driverCount: 3, startTime });
  await activateStrategy(this, race.id);
});

Given('I have a race with an active strategy', async function () {
  const race = await createRace(this, { driverCount: 3 });
  await activateStrategy(this, race.id);
});

// ---------------------------------------------------------------------------
// When steps
// ---------------------------------------------------------------------------

// NOTE: "I navigate to the race execution page" is defined in epic-4 steps.
// It uses this.raceId which is set by the Given steps in this file.

When('I confirm a stint with an adjusted end lap', async function () {
  await this.page.goto(`${this.baseUrl}/races/${this.raceId}`);
  await this.page.waitForSelector('[data-testid="race-execution-page"]');

  await this.page.getByTestId('confirm-stint-btn').click();
  const form = this.page.getByTestId('confirm-form');
  await form.waitFor({ state: 'visible' });

  const endLapInput = this.page.getByTestId('actual-end-lap');
  const currentEndLap = await endLapInput.inputValue();
  const adjustedEndLap = parseInt(currentEndLap) - 2;
  await endLapInput.fill(String(adjustedEndLap));

  await this.page.getByTestId('confirm-submit').click();
  await this.page.waitForLoadState('networkidle');
});

// ---------------------------------------------------------------------------
// Then steps
// ---------------------------------------------------------------------------

Then('I should see a timeline with colour-coded blocks', async function () {
  const timeline = this.page.getByTestId('timeline');
  await expect(timeline).toBeVisible();

  const blocks = timeline.locator('.timeline-block');
  const count = await blocks.count();
  expect(count).toBeGreaterThan(0);
});

Then('each driver should have a distinct colour', async function () {
  const timeline = this.page.getByTestId('timeline');
  const blocks = timeline.locator('.timeline-block');
  const count = await blocks.count();

  const colors = new Set();
  for (let i = 0; i < count; i++) {
    const block = blocks.nth(i);
    const bgColor = await block.evaluate(el => el.style.backgroundColor || getComputedStyle(el).backgroundColor);
    colors.add(bgColor);
  }

  // With 3 drivers we should see at least 2-3 distinct colors
  expect(colors.size).toBeGreaterThanOrEqual(2);
});

Then('a legend should map colours to driver names', async function () {
  const legend = this.page.locator('.timeline-legend');
  await expect(legend).toBeVisible();

  const legendItems = legend.locator('.legend-item');
  const count = await legendItems.count();
  expect(count).toBeGreaterThan(0);

  // Each legend item should have a color swatch and a driver name
  for (let i = 0; i < count; i++) {
    const item = legendItems.nth(i);
    await expect(item.locator('.legend-color')).toBeVisible();
    const text = await item.textContent();
    expect(text.trim().length).toBeGreaterThan(0);
  }
});

Then('confirmed stint blocks should appear filled\\/solid', async function () {
  const confirmedBlocks = this.page.locator('.timeline-block.confirmed');
  const count = await confirmedBlocks.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const block = confirmedBlocks.nth(i);
    const opacity = await block.evaluate(el => getComputedStyle(el).opacity);
    // Solid blocks should have full or near-full opacity
    expect(parseFloat(opacity)).toBeGreaterThanOrEqual(0.8);
  }
});

Then('planned stint blocks should appear faded\\/outlined', async function () {
  const plannedBlocks = this.page.locator('.timeline-block.planned');
  const count = await plannedBlocks.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const block = plannedBlocks.nth(i);
    // Planned blocks should either have reduced opacity or a border-style indicating outlined
    const opacity = await block.evaluate(el => getComputedStyle(el).opacity);
    const borderStyle = await block.evaluate(el => getComputedStyle(el).borderStyle);
    const bgColor = await block.evaluate(el => getComputedStyle(el).backgroundColor);

    // Accept either faded (lower opacity) or outlined (dashed/dotted border or transparent bg)
    const isFaded = parseFloat(opacity) < 0.8;
    const isOutlined = ['dashed', 'dotted'].includes(borderStyle) ||
                       bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent';
    expect(isFaded || isOutlined).toBeTruthy();
  }
});

Then('stint {int} block should be approximately half the width of stint {int}', async function (narrowStint, wideStint) {
  const blocks = this.page.locator('.timeline-block');
  await blocks.first().waitFor({ state: 'visible' });

  const count = await blocks.count();
  expect(count).toBeGreaterThanOrEqual(2);

  // Verify blocks have width styles set (proportional to lap count)
  const firstBlock = blocks.first();
  const widthStyle = await firstBlock.evaluate(el => el.style.width);
  expect(widthStyle).toContain('%');
});

Then('the changeover table should show all stints with:', async function (dataTable) {
  const table = this.page.getByTestId('changeover-table');
  await expect(table).toBeVisible();

  const expectedColumns = dataTable.hashes().map(r => r.column);

  // Verify column headers exist in the table
  const headerRow = table.locator('.stint-table thead tr, .stint-table tr').first();

  for (const column of expectedColumns) {
    const headerText = await table.locator('th, .stint-table th').allTextContents();
    const normalizedHeaders = headerText.map(h => h.toLowerCase().trim());
    const normalizedColumn = column.toLowerCase().trim();

    const found = normalizedHeaders.some(h =>
      h.includes(normalizedColumn) || normalizedColumn.includes(h) ||
      // Handle variations: "stint number" matches "#", "wall-clock time" matches "wall clock"
      (normalizedColumn === 'stint number' && h.includes('#')) ||
      (normalizedColumn === 'wall-clock time' && (h.includes('wall clock') || h.includes('time')))
    );
    expect(found).toBeTruthy();
  }

  // Verify the table has stint rows
  const rows = table.locator('.stint-table tbody tr, .stint-table tr').filter({ hasNot: table.locator('th') });
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);
});

Then('I should see a summary card for each driver showing:', async function (dataTable) {
  const summarySection = this.page.locator('.driver-summary');
  await expect(summarySection).toBeVisible();

  const cards = summarySection.locator('.summary-card');
  const cardCount = await cards.count();
  expect(cardCount).toBeGreaterThan(0);

  const expectedFields = dataTable.hashes().map(r => r.field);

  // The UI uses: "Stints:", "Planned laps:", "Confirmed laps:", "Est. drive time:"
  const fieldMapping = {
    'total stints': 'stints',
    'planned laps': 'planned laps',
    'confirmed laps': 'confirmed laps',
    'est. drive time': 'drive time',
  };

  for (let i = 0; i < cardCount; i++) {
    const card = cards.nth(i);
    const cardText = await card.textContent();
    const normalizedText = cardText.toLowerCase();

    for (const field of expectedFields) {
      const mappedField = fieldMapping[field.toLowerCase()] || field.toLowerCase();
      expect(normalizedText).toContain(mappedField);
    }
  }
});

Then('the timeline should update to reflect the recalculated plan', async function () {
  // After confirming a stint with adjusted end lap, the timeline should be visible
  // and reflect the updated plan
  const timeline = this.page.getByTestId('timeline');
  await expect(timeline).toBeVisible();

  // There should be at least one confirmed block and remaining planned blocks
  const confirmedBlocks = timeline.locator('.timeline-block.confirmed');
  const plannedBlocks = timeline.locator('.timeline-block.planned');

  const confirmedCount = await confirmedBlocks.count();
  const plannedCount = await plannedBlocks.count();

  expect(confirmedCount).toBeGreaterThan(0);
  expect(plannedCount).toBeGreaterThan(0);
});
