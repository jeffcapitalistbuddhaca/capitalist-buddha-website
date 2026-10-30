const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:7777', { waitUntil: 'load', timeout: 10000 });
  
  await page.screenshot({ path: 'sandbox/pending/11-header-tight-bottom.png' });
  console.log('Screenshot saved');
  
  await browser.close();
})();
