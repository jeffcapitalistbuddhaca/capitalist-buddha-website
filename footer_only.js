const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:8000', { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({ path: 'sandbox/pending/24-footer-bottom.png' });
    await browser.close();
    console.log('Footer screenshot saved');
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
})();
