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

    console.log('Loading site...');
    await page.goto('https://starlit-maamoul-d06e25.netlify.app', {
      waitUntil: 'networkidle'
    });

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
    const firstModule = await page.locator('.module-header').first();
    await firstModule.click();

    await page.waitForTimeout(1500);

    console.log('Taking screenshot of expanded module...');
    await page.screenshot({ path: 'screenshot-expanded-module.png', fullPage: true });
    console.log('✓ Expanded module screenshot saved');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
