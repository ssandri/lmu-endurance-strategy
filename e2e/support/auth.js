const { Given } = require('@cucumber/cucumber');

Given('I am logged in as {string}', async function (email) {
  const password = 'testpass123';

  // Register user via API (ignore if already exists)
  await fetch(`${this.apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  // Login via UI
  await this.page.goto(`${this.baseUrl}/login`);
  await this.page.fill('input[type="email"]', email);
  await this.page.fill('input[type="password"]', password);
  await this.page.click('button[type="submit"]');
  await this.page.waitForURL(`${this.baseUrl}/`);
});

Given('I am on the login page', async function () {
  await this.page.goto(`${this.baseUrl}/login`);
});

Given('I am not logged in', async function () {
  await this.page.goto(`${this.baseUrl}/login`);
});
