const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

When('I switch to register mode', async function () {
  await this.page.click('p.toggle');
  await expect(this.page.locator('h2')).toHaveText('Create Account');
});

When('I switch back to login mode', async function () {
  await this.page.click('p.toggle');
  await expect(this.page.locator('h2')).toHaveText('Sign In');
});

When('I fill in the registration form with email {string}, password {string}, and code {string}', async function (email, password, code) {
  // Use a unique email to avoid conflicts with previous test runs
  const uniqueEmail = email.includes('@') ? email.replace('@', `+${Date.now()}@`) : email;
  this.lastRegistrationEmail = uniqueEmail;
  await this.page.fill('input[type="email"]', uniqueEmail);
  await this.page.fill('input[type="password"]', password);
  const codeInput = this.page.locator('[data-testid="registration-code-input"]');
  if (await codeInput.isVisible()) {
    await codeInput.fill(code);
  }
});

When('I submit the registration form', async function () {
  await this.page.click('button[type="submit"]');
});

Then('I should be redirected to the dashboard', async function () {
  await this.page.waitForURL(`${this.baseUrl}/`, { timeout: 10000 });
  await expect(this.page).toHaveURL(`${this.baseUrl}/`);
});

Then('I should see a registration code input', async function () {
  await expect(this.page.locator('[data-testid="registration-code-input"]')).toBeVisible();
});

Then('I should not see a registration code input', async function () {
  await expect(this.page.locator('[data-testid="registration-code-input"]')).not.toBeVisible();
});

Then('I should see an error message on the form', async function () {
  await expect(this.page.locator('.error')).toBeVisible({ timeout: 5000 });
});

Then('the registration form should not be submitted', async function () {
  // Page stays on /login when browser validation blocks submission
  await expect(this.page).toHaveURL(`${this.baseUrl}/login`);
});
