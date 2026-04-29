const { setWorldConstructor, World, Before, After } = require('@cucumber/cucumber');
const { chromium } = require('playwright');

class CustomWorld extends World {
  constructor(options) {
    super(options);
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.apiUrl = process.env.API_URL || 'http://localhost:3001';
  }
}

setWorldConstructor(CustomWorld);

Before(async function () {
  this.browser = await chromium.launch({ headless: process.env.HEADED !== 'true' });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
});

After(async function () {
  if (this.page) await this.page.close();
  if (this.context) await this.context.close();
  if (this.browser) await this.browser.close();
});
