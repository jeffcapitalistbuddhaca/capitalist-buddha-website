const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
    
    console.log('Capturing header...');
    await page.screenshot({ path: 'sandbox/pending/01-header-new-emblem.png', fullPage: false });
    
    console.log('Scrolling to footer...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    console.log('Capturing footer...');
    await page.screenshot({ path: 'sandbox/pending/02-footer-new-emblem.png', fullPage: false });
    
    console.log('✓ Screenshots saved to sandbox/pending/');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
