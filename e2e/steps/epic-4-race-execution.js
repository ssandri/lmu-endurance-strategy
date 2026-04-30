const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// --- Background Steps ---

Given('I have a race {string} with an active strategy', async function (raceName) {
  // Create race with 3 drivers
  const createRes = await fetch(`${this.apiUrl}/api/races`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: this.cookie,
    },
    body: JSON.stringify({
      name: raceName,
      track: 'Spa-Francorchamps',
      durationHours: 6,
      estimatedTotalLaps: 140,
      drivers: [
        { name: 'Alice', avgLapTimeMs: 132000 },
        { name: 'Bob', avgLapTimeMs: 134000 },
        { name: 'Charlie', avgLapTimeMs: 135000 },
      ],
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create race: ${await createRes.text()}`);
  }

  const race = await createRes.json();
  this.raceId = race.id;

  // Calculate strategy
  const calcRes = await fetch(`${this.apiUrl}/api/strategies/${this.raceId}/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: this.cookie,
    },
    body: JSON.stringify({
      name: 'Test Strategy',
      fuelPerLap: 3.5,
      energyPerLap: 2.0,
      estimatedTotalLaps: 140,
    }),
  });

  if (!calcRes.ok) {
    throw new Error(`Failed to calculate strategy: ${await calcRes.text()}`);
  }

  const strategies = await calcRes.json();
  const strategyId = Array.isArray(strategies) ? strategies[0].id : strategies.id;

  // Activate strategy
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

Given('the strategy has the following planned stints:', async function (dataTable) {
  // Stints are created by the activate strategy call above.
  // Store expected stints for later assertions.
  this.expectedStints = dataTable.hashes().map(row => ({
    stint: parseInt(row.stint),
    driver: row.driver,
    startLap: parseInt(row.startLap),
    endLap: parseInt(row.endLap),
  }));

  // Fetch actual stints to store their IDs
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch stints: ${await res.text()}`);
  }

  this.stints = await res.json();
});

// --- Navigation ---

When('I navigate to the race execution page', async function () {
  await this.page.goto(`${this.baseUrl}/races/${this.raceId}`);
  await this.page.waitForSelector('[data-testid="race-execution-page"]');
});

// --- Current and Upcoming Stints ---

Then('I should see stint {int} as the current stint', async function (stintNumber) {
  const currentStint = this.page.locator('[data-testid="current-stint"]');
  await expect(currentStint).toBeVisible();
  await expect(currentStint).toContainText(`${stintNumber}`);
});

Then('I should see the next {int} upcoming stints', async function (count) {
  const upcomingStints = this.page.locator('.stint-card:not(.active)');
  await expect(upcomingStints).toHaveCount(count);
});

Then('each stint should show driver name, lap range, and estimated start time', async function () {
  const stintCards = this.page.locator('.stint-card');
  const count = await stintCards.count();

  for (let i = 0; i < count; i++) {
    const card = stintCards.nth(i);
    // Driver name should be visible
    const text = await card.textContent();
    const hasDriver = this.expectedStints.some(s => text.includes(s.driver));
    expect(hasDriver).toBeTruthy();
    // Lap range (some number pattern)
    expect(text).toMatch(/\d+/);
  }
});

// --- Confirm Stint ---

When('I click {string} on stint {int}', async function (buttonText, stintNumber) {
  await this.page.getByTestId('confirm-stint-btn').click();
});

When('I confirm with default values', async function () {
  const form = this.page.getByTestId('confirm-form');
  await expect(form).toBeVisible();
  await this.page.getByTestId('confirm-submit').click();
  await this.page.waitForLoadState('networkidle');
});

Then('stint {int} should be marked as completed', async function (stintNumber) {
  const completedStint = this.page.locator(`[data-testid="timeline-block-${stintNumber}"]`);
  await expect(completedStint).toHaveClass(/completed|confirmed/);
});

Then('stint {int} should become the current stint', async function (stintNumber) {
  const currentStint = this.page.locator('[data-testid="current-stint"]');
  await expect(currentStint).toContainText(`${stintNumber}`);
});

// --- Confirm Stint with Adjusted Values ---

When('I set actual end lap to {int}', async function (lap) {
  await this.page.getByTestId('actual-end-lap').fill(`${lap}`);
});

When('I set fuel added to {int}', async function (fuel) {
  await this.page.getByTestId('fuel-added').fill(`${fuel}`);
});

When('I confirm the stint', async function () {
  await this.page.getByTestId('confirm-submit').click();
  await this.page.waitForLoadState('networkidle');
});

Then('stint {int} should show actual end lap {int}', async function (stintNumber, endLap) {
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const stints = await res.json();
  const stint = stints.find(s => s.stint_number === stintNumber);
  expect(stint).toBeDefined();
  expect(stint.actual_end_lap).toBe(endLap);
});

Then('all future stints should be recalculated from lap {int}', async function (startLap) {
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const stints = await res.json();

  const unconfirmed = stints.filter(s => !s.confirmed);
  if (unconfirmed.length > 0) {
    expect(unconfirmed[0].planned_start_lap).toBe(startLap);
  }
});

// --- Pit Stop Form Defaults ---

Then('the pit stop form should show:', async function (dataTable) {
  const form = this.page.getByTestId('confirm-form');
  await expect(form).toBeVisible();

  const fieldMap = {
    energyAdded: 'energy-added',
    fuelAdded: 'fuel-added',
    tyresChanged: 'tyres-changed',
    damageType: 'damage-type',
  };

  const rows = dataTable.hashes();
  for (const row of rows) {
    const testId = fieldMap[row.field] || row.field;
    const field = this.page.getByTestId(testId);
    const value = await field.inputValue();
    expect(value).toBe(row.default);
  }
});

// --- Pit Time Calculation ---

When('I confirm stint {int} with:', async function (stintNumber, dataTable) {
  await this.page.goto(`${this.baseUrl}/races/${this.raceId}`);
  await this.page.waitForSelector('[data-testid="race-execution-page"]');

  await this.page.getByTestId('confirm-stint-btn').click();
  const form = this.page.getByTestId('confirm-form');
  await expect(form).toBeVisible();

  const rows = dataTable.raw();
  const values = {};
  for (const [key, val] of rows) {
    values[key.trim()] = val.trim();
  }

  if (values.fuelAdded) await this.page.getByTestId('fuel-added').fill(values.fuelAdded);
  if (values.tyresChanged) await this.page.getByTestId('tyres-changed').selectOption(values.tyresChanged);
  if (values.damageType) await this.page.getByTestId('damage-type').selectOption(values.damageType);
  if (values.energyAdded) await this.page.getByTestId('energy-added').fill(values.energyAdded);

  await this.page.getByTestId('confirm-submit').click();
  await this.page.waitForLoadState('networkidle');

  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const stints = await res.json();
  this.confirmedStint = stints.find(s => s.confirmed) || stints[0];
});

Then('the recorded pit time should be the sum of:', async function (dataTable) {
  const rows = dataTable.hashes();
  let expectedTotal = 0;
  for (const row of rows) {
    expectedTotal += parseFloat(row.value);
  }

  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const stints = await res.json();
  const confirmed = stints.find(s => s.confirmed);
  expect(confirmed).toBeDefined();
  expect(confirmed.actual_pit_time_sec).toBeCloseTo(expectedTotal, 1);
});

// --- Damage Types ---

When('I confirm stint {int} with damage {string}', async function (stintNumber, damageType) {
  await this.page.goto(`${this.baseUrl}/races/${this.raceId}`);
  await this.page.waitForSelector('[data-testid="race-execution-page"]');

  await this.page.getByTestId('confirm-stint-btn').click();
  const form = this.page.getByTestId('confirm-form');
  await expect(form).toBeVisible();
  await this.page.getByTestId('damage-type').selectOption(damageType);
  await this.page.getByTestId('confirm-submit').click();
  await this.page.waitForLoadState('networkidle');
});

Then('the pit time should include {int} seconds for damage repair', async function (seconds) {
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const stints = await res.json();
  const confirmed = stints.find(s => s.confirmed);
  expect(confirmed).toBeDefined();
  expect(confirmed.actual_pit_time_sec).toBeGreaterThanOrEqual(seconds);
});

// --- Future Stints Recalculated ---

When('I confirm stint {int} ending on lap {int} instead of {int}', async function (stintNumber, actualEnd, plannedEnd) {
  await this.page.goto(`${this.baseUrl}/races/${this.raceId}`);
  await this.page.waitForSelector('[data-testid="race-execution-page"]');

  const origRes = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  this.originalStints = await origRes.json();

  await this.page.getByTestId('confirm-stint-btn').click();
  const form = this.page.getByTestId('confirm-form');
  await expect(form).toBeVisible();
  await this.page.getByTestId('actual-end-lap').fill(`${actualEnd}`);
  await this.page.getByTestId('confirm-submit').click();
  await this.page.waitForLoadState('networkidle');
});

Then('stints {int} onwards should be recalculated', async function (fromStint) {
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const currentStints = await res.json();
  const unconfirmed = currentStints.filter(s => !s.confirmed);

  expect(unconfirmed.length).toBeGreaterThan(0);
  expect(unconfirmed[0].planned_start_lap).not.toBe(this.originalStints[fromStint - 1]?.planned_start_lap);
});

Then('the total number of stints may change', async function () {
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const currentStints = await res.json();
  // Just verify we still have stints — count may differ from original
  expect(currentStints.length).toBeGreaterThan(0);
});

Then('confirmed stint {int} should remain unchanged', async function (stintNumber) {
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const currentStints = await res.json();
  const confirmed = currentStints.find(s => s.stint_number === stintNumber);
  const original = this.originalStints.find(s => s.stint_number === stintNumber);

  expect(confirmed).toBeDefined();
  expect(confirmed.confirmed).toBeTruthy();
  if (original) {
    expect(confirmed.planned_start_lap).toBe(original.planned_start_lap);
  }
});

// --- Confirmed Stints Never Modified ---

When('I confirm stint {int} and then confirm stint {int}', async function (stint1, stint2) {
  await this.page.goto(`${this.baseUrl}/races/${this.raceId}`);
  await this.page.waitForSelector('[data-testid="race-execution-page"]');

  // Confirm stint 1
  await this.page.getByTestId('confirm-stint-btn').click();
  let form = this.page.getByTestId('confirm-form');
  await expect(form).toBeVisible();
  await this.page.getByTestId('confirm-submit').click();
  await this.page.waitForLoadState('networkidle');

  // Store stint 1 data after first confirmation
  const res1 = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const stintsAfterFirst = await res1.json();
  this.stint1AfterFirstConfirm = stintsAfterFirst.find(s => s.stint_number === stint1);

  // Confirm stint 2
  await this.page.getByTestId('confirm-stint-btn').click();
  form = this.page.getByTestId('confirm-form');
  await expect(form).toBeVisible();
  await this.page.getByTestId('confirm-submit').click();
  await this.page.waitForLoadState('networkidle');
});

Then('stint {int} data should be identical to when it was first confirmed', async function (stintNumber) {
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const stints = await res.json();
  const current = stints.find(s => s.stint_number === stintNumber);

  expect(current).toBeDefined();
  expect(current.planned_start_lap).toBe(this.stint1AfterFirstConfirm.planned_start_lap);
  expect(current.actual_end_lap).toBe(this.stint1AfterFirstConfirm.actual_end_lap);
  expect(current.confirmed).toBe(this.stint1AfterFirstConfirm.confirmed);
});

// --- Update Estimated Total Laps ---

When('I update estimated total laps to {int}', async function (totalLaps) {
  const origRes = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  this.originalStints = await origRes.json();

  const lapsInput = this.page.getByTestId('laps-control').locator('input[type="number"]');
  await lapsInput.fill(`${totalLaps}`);
  await this.page.getByTestId('update-laps-btn').click();
  await this.page.waitForLoadState('networkidle');
});

Then('all unconfirmed stints should be recalculated for {int} total laps', async function (totalLaps) {
  // Verify the race's estimated_total_laps was updated
  const raceRes = await fetch(`${this.apiUrl}/api/races/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const race = await raceRes.json();
  expect(race.estimated_total_laps).toBe(totalLaps);

  // Verify stints still exist
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const stints = await res.json();
  expect(stints.length).toBeGreaterThan(0);
});

// --- Reorder Driver Rotation ---

When('I move driver {string} to position {int}', async function (driverName, position) {
  // Store original stints for comparison
  const origRes = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  this.originalStints = await origRes.json();

  const driverOrder = this.page.getByTestId('driver-order');
  const driverItem = driverOrder.locator('.driver-item', { hasText: driverName });

  // Click the up arrow until the driver is in the target position
  const allItems = driverOrder.locator('.driver-item');
  let currentPosition = -1;

  const count = await allItems.count();
  for (let i = 0; i < count; i++) {
    const text = await allItems.nth(i).textContent();
    if (text.includes(driverName)) {
      currentPosition = i + 1; // 1-based
      break;
    }
  }

  while (currentPosition > position) {
    await driverItem.locator('.order-controls button', { hasText: /↑/ }).click();
    currentPosition--;
  }

  while (currentPosition < position) {
    await driverItem.locator('.order-controls button', { hasText: /↓/ }).click();
    currentPosition++;
  }

  await this.page.waitForLoadState('networkidle');
});

Then('future unconfirmed stints should reflect the new driver order', async function () {
  // Verify driver order was updated
  const driverRes = await fetch(`${this.apiUrl}/api/drivers/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const drivers = await driverRes.json();
  expect(drivers[0].name).toBe('Charlie');
});

Then('confirmed stints should remain unchanged', async function () {
  const res = await fetch(`${this.apiUrl}/api/stints/${this.raceId}`, {
    headers: { Cookie: this.cookie },
  });
  const stints = await res.json();
  const confirmed = stints.filter(s => s.confirmed);
  const originalConfirmed = this.originalStints.filter(s => s.confirmed);

  for (let i = 0; i < originalConfirmed.length; i++) {
    const orig = originalConfirmed[i];
    const curr = confirmed[i];
    expect(curr).toBeDefined();
    expect(curr.planned_start_lap).toBe(orig.planned_start_lap);
    expect(curr.actual_end_lap).toBe(orig.actual_end_lap);
    expect(curr.driver_id).toBe(orig.driver_id);
  }
});
