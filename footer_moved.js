const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 2800 });
    await page.goto('http://localhost:8000', { waitUntil: 'load' });
    await page.screenshot({ path: 'sandbox/pending/35-footer-moved-down.png' });
    await browser.close();
    console.log('Screenshot saved');
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
})();
