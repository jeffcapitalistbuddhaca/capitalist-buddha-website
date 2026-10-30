const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    console.log('Launching Chromium with Playwright...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    console.log('Loading homepage...');
    await page.goto('https://starlit-maamoul-d06e25.netlify.app', {
      waitUntil: 'networkidle'
    });

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'screenshot-homepage.png', fullPage: true });
    console.log('✓ Homepage screenshot saved');

    // Try login
    try {
      const emailInput = await page.$('#login-email');
      if (emailInput) {
        console.log('Logging in...');
        await page.fill('#login-email', 'demo@test.com');
        await page.fill('#login-password', 'Welcome123!');
        await page.click('#login-form button');

        await page.waitForTimeout(2000);

        console.log('Taking modules screenshot...');
        await page.screenshot({ path: 'screenshot-modules.png', fullPage: true });
        console.log('✓ Modules screenshot saved');
      }
    } catch (e) {
      console.log('Login screenshot failed:', e.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
