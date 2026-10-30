const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    console.log('Loading localhost...');
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });

    // Click Login to Course tab
    await page.click('[data-tab="login"]');
    await page.waitForTimeout(1000);

    // Login
    await page.fill('#login-email', 'demo@test.com');
    await page.fill('#login-password', 'Welcome123!');
    await page.click('#login-form button');
    await page.waitForTimeout(2000);

    // Click first module to expand it
    console.log('Expanding first module...');
    await page.locator('.module-header').first().click();
    await page.waitForTimeout(1500);

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'screenshot-local.png', fullPage: true });
    console.log('✓ Screenshot saved');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
