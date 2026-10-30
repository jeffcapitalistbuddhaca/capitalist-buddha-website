const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function screenshot() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });

  try {
    const page = await browser.newPage();

    // Set viewport for consistent sizing
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Loading site...');
    await page.goto('https://starlit-maamoul-d06e25.netlify.app', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Taking screenshot of homepage...');
    await page.screenshot({ path: 'screenshot-homepage.png', fullPage: true });

    // Try to login and view modules
    console.log('Attempting to login...');
    try {
      await page.type('#login-email', 'demo@test.com');
      await page.type('#login-password', 'Welcome123!');
      await page.click('#login-form button');

      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);

      // Click Login to Course tab
      await page.click('[data-tab="login"]').catch(() => {});
      await page.waitForTimeout(2000);

      console.log('Taking screenshot of modules...');
      await page.screenshot({ path: 'screenshot-modules.png', fullPage: true });
    } catch (e) {
      console.log('Login attempt:', e.message);
    }

    console.log('✓ Screenshots created: screenshot-homepage.png, screenshot-modules.png');
  } finally {
    await browser.close();
  }
}

screenshot().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
