const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:9001');
  
  await page.screenshot({ path: 'sandbox/pending/05-header-compact-sides.png' });
  console.log('Header ✓');
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'sandbox/pending/06-footer-compact.png' });
  console.log('Footer ✓');
  
  await browser.close();
})();
