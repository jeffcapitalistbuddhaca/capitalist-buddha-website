const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    console.log('Launching Chromium...');
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
    console.log('Clicking Login to Course tab...');
    await page.click('[data-tab="login"]');
    await page.waitForTimeout(1000);

    console.log('Taking modules page screenshot...');
    await page.screenshot({ path: 'screenshot-login-page.png', fullPage: true });
    console.log('✓ Login page screenshot saved');

    // Try to login
    try {
      console.log('Filling login form...');
      await page.fill('#login-email', 'demo@test.com');
      await page.fill('#login-password', 'Welcome123!');

      console.log('Submitting login...');
      await page.click('#login-form button');

      await page.waitForTimeout(2000);

      console.log('Taking modules screenshot after login...');
      await page.screenshot({ path: 'screenshot-modules-page.png', fullPage: true });
      console.log('✓ Modules screenshot saved');
    } catch (e) {
      console.log('Login attempt error:', e.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
