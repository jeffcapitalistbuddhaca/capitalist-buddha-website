const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:9003');
  
  await page.screenshot({ path: 'sandbox/pending/09-header-overlap-tight.png' });
  console.log('✓');
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'sandbox/pending/10-footer-final.png' });
  console.log('✓');
  
  await browser.close();
})();
