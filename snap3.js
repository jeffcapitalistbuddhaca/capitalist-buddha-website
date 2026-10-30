const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:9000');
  
  await page.screenshot({ path: 'sandbox/pending/01-header-white-emblem.png' });
  console.log('Header ✓');
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'sandbox/pending/02-footer-white-emblem.png' });
  console.log('Footer ✓');
  
  await browser.close();
})();
