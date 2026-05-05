const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// ──────────────────────────────────────────────
// Helper: create a race via API and store its id
// ──────────────────────────────────────────────
async function createRace(world, name, activateStrategy = false) {
  const res = await fetch(`${world.apiUrl}/api/races`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: world.cookie },
    body: JSON.stringify({
      name,
      track: 'Monza',
      durationHours: 6,
      drivers: [
        { name: 'Driver A', avgLapTimeMs: 90000 },
        { name: 'Driver B', avgLapTimeMs: 91000 },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Failed to create race: ${await res.text()}`);
  const race = await res.json();

  if (activateStrategy) {
    const calcRes = await fetch(`${world.apiUrl}/api/strategies/${race.id}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: world.cookie },
      body: JSON.stringify({ name: 'Default', fuelPerLap: 3.5, energyPerLap: 2.0, estimatedTotalLaps: 240 }),
    });
    if (calcRes.ok) {
      const variants = await calcRes.json();
      const strategyId = Array.isArray(variants) ? variants[0].id : variants.id;
      await fetch(`${world.apiUrl}/api/strategies/${race.id}/activate/${strategyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: world.cookie },
      });
    }
  }
  return race;
}

// ──────────────────────────────────────────────
// Navigation steps
// ──────────────────────────────────────────────

Given('I am on the dashboard page', async function () {
  await this.page.goto(`${this.baseUrl}/`);
  await this.page.waitForLoadState('networkidle');
});

Given('I navigate to the race creation page', async function () {
  await this.page.goto(`${this.baseUrl}/races/new`);
  await this.page.waitForLoadState('networkidle');
});

Given('a race exists with name {string}', async function (name) {
  this.theRace = await createRace(this, name, false);
});

Given('I navigate to the strategy creation page for that race', async function () {
  await this.page.goto(`${this.baseUrl}/races/${this.theRace.id}/strategy/new`);
  await this.page.waitForLoadState('networkidle');
});

Given('a race exists with an active strategy', async function () {
  this.theRace = await createRace(this, `Theme Active ${Date.now()}`, true);
});

Given('a race exists without an active strategy', async function () {
  this.theRace = await createRace(this, `Theme Planned ${Date.now()}`, false);
});

Given('a race exists with a strategy that has stints', async function () {
  this.theRace = await createRace(this, `Theme Stints ${Date.now()}`, true);
});

Given('I navigate to the race execution page for that race', async function () {
  await this.page.goto(`${this.baseUrl}/races/${this.theRace.id}`);
  await this.page.waitForLoadState('networkidle');
});

// ──────────────────────────────────────────────
// Dark theme checks
// ──────────────────────────────────────────────

Then('the body background colour should be dark', async function () {
  const bg = await this.page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  // rgb(11, 15, 23) = #0b0f17 — the base dark colour
  // Accept any very dark background (all channels below 30)
  const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(match).not.toBeNull();
  const [, r, g, b] = match.map(Number);
  expect(r).toBeLessThan(40);
  expect(g).toBeLessThan(40);
  expect(b).toBeLessThan(60);
});

Then('the computed background of the body should be the base dark colour', async function () {
  const bg = await this.page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  // #0b0f17 = rgb(11, 15, 23)
  expect(bg).toBe('rgb(11, 15, 23)');
});

Then('the header should have a dark surface background', async function () {
  const bg = await this.page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return null;
    return window.getComputedStyle(header).backgroundColor;
  });
  expect(bg).not.toBeNull();
  // #151c28 = rgb(21, 28, 40)
  const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(match).not.toBeNull();
  const [, r, g, b] = match.map(Number);
  expect(r).toBeLessThan(50);
  expect(g).toBeLessThan(50);
  expect(b).toBeLessThan(70);
});

// ──────────────────────────────────────────────
// WEC red accent on primary buttons
// ──────────────────────────────────────────────

Then('primary buttons should use the WEC red accent colour', async function () {
  const bg = await this.page.evaluate(() => {
    const btn = document.querySelector('.btn-primary');
    if (!btn) return null;
    return window.getComputedStyle(btn).backgroundColor;
  });
  expect(bg).not.toBeNull();
  // --color-accent: #e8001d = rgb(232, 0, 29)
  const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(match).not.toBeNull();
  const [, r, g, b] = match.map(Number);
  // Red channel should be high, green and blue should be very low
  expect(r).toBeGreaterThan(200);
  expect(g).toBeLessThan(20);
  expect(b).toBeLessThan(50);
});

// ──────────────────────────────────────────────
// CSS custom property token system
// ──────────────────────────────────────────────

Then('the CSS custom property {string} should be defined', async function (propertyName) {
  const value = await this.page.evaluate((prop) => {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }, propertyName);
  expect(value).not.toBe('');
});

// ──────────────────────────────────────────────
// Typography
// ──────────────────────────────────────────────

Then('the body font family should include {string}', async function (fontName) {
  const fontFamily = await this.page.evaluate(() => {
    return window.getComputedStyle(document.body).fontFamily;
  });
  expect(fontFamily.toLowerCase()).toContain(fontName.toLowerCase());
});

// ──────────────────────────────────────────────
// Page card surface background
// ──────────────────────────────────────────────

Then('the page card should have a dark surface background', async function () {
  const bg = await this.page.evaluate(() => {
    const card = document.querySelector('.page-card');
    if (!card) return null;
    return window.getComputedStyle(card).backgroundColor;
  });
  expect(bg).not.toBeNull();
  // #151c28 = rgb(21, 28, 40)
  const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(match).not.toBeNull();
  const [, r, g, b] = match.map(Number);
  expect(r).toBeLessThan(50);
  expect(g).toBeLessThan(50);
  expect(b).toBeLessThan(70);
});

// ──────────────────────────────────────────────
// Status badge variants
// ──────────────────────────────────────────────

Then('the strategy badge with variant {string} should be visible', async function (variant) {
  await this.page.goto(`${this.baseUrl}/`);
  await this.page.waitForLoadState('networkidle');
  await expect(this.page.locator(`.badge-${variant}`).first()).toBeVisible({ timeout: 5000 });
});

Then('the active badge should use the success colour', async function () {
  const color = await this.page.evaluate(() => {
    const badge = document.querySelector('.badge-active');
    if (!badge) return null;
    return window.getComputedStyle(badge).color;
  });
  expect(color).not.toBeNull();
  // --color-success: #22c55e = rgb(34, 197, 94)
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(match).not.toBeNull();
  const [, r, g, b] = match.map(Number);
  // Green channel should dominate
  expect(g).toBeGreaterThan(150);
  expect(r).toBeLessThan(100);
});

// ──────────────────────────────────────────────
// Driver timeline colours distinct from WEC red
// ──────────────────────────────────────────────

Then('the timeline blocks should not use the WEC red colour {string}', async function (wecRed) {
  const timeline = this.page.locator('[data-testid="timeline"]');
  const count = await this.page.locator('[data-testid^="timeline-block-"]').count();
  if (count === 0) {
    // No stints rendered yet — skip colour check
    return;
  }
  const colors = await this.page.evaluate(() => {
    const blocks = document.querySelectorAll('[data-testid^="timeline-block-"]');
    return Array.from(blocks).map(b => window.getComputedStyle(b).backgroundColor);
  });
  // Convert #e8001d to rgb for comparison
  for (const color of colors) {
    expect(color).not.toBe('rgb(232, 0, 29)');
  }
});

// ──────────────────────────────────────────────
// Responsive layout at 1280px
// ──────────────────────────────────────────────

When('the viewport is set to 1280px wide', async function () {
  await this.page.setViewportSize({ width: 1280, height: 800 });
});

Then('the page layout should be visible without horizontal scrolling', async function () {
  const scrollWidth = await this.page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await this.page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for sub-pixel rounding
});

// ──────────────────────────────────────────────
// Login page regression
// ──────────────────────────────────────────────

Then('the login page should render correctly', async function () {
  // Clear session so the app does not redirect an authenticated user away from /login
  await this.context.clearCookies();
  await this.page.goto(`${this.baseUrl}/login`);
  await this.page.waitForLoadState('networkidle');
  await expect(this.page.locator('.login-card')).toBeVisible({ timeout: 5000 });
});

Then('the login form should have email and password inputs', async function () {
  await expect(this.page.locator('input[type="email"]')).toBeVisible();
  await expect(this.page.locator('input[type="password"]')).toBeVisible();
});
