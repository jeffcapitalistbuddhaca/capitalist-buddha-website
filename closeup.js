const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 500 });
    await page.goto('http://localhost:8000', { waitUntil: 'load' });
    await page.screenshot({ path: 'sandbox/pending/16-closeup-header.png' });
    await browser.close();
    console.log('Closeup screenshot saved');
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
})();
