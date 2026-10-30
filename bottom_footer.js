const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto('http://localhost:8000', { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 500));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'sandbox/pending/26-footer-visible.png' });
    await browser.close();
    console.log('Footer visible screenshot saved');
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
})();
