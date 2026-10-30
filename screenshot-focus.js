const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
    await page.click('[data-tab="login"]');
    await page.waitForTimeout(1000);

    await page.fill('#login-email', 'demo@test.com');
    await page.fill('#login-password', 'Welcome123!');
    await page.click('#login-form button');
    await page.waitForTimeout(2000);

    await page.locator('.module-header').first().click();
    await page.waitForTimeout(1500);

    // Take focused screenshot of the module content area
    const moduleContent = await page.locator('.module-content').first();
    await moduleContent.screenshot({ path: 'screenshot-module1-focus.png' });
    console.log('✓ Focused screenshot saved');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
