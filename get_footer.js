const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto('http://localhost:8000', { waitUntil: 'load' });
    
    const height = await page.evaluate(() => document.body.scrollHeight);
    console.log('Page height:', height);
    
    const footerTop = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      return footer.getBoundingClientRect().top + window.scrollY;
    });
    console.log('Footer top:', footerTop);
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: 'sandbox/pending/27-footer-at-bottom.png' });
    await browser.close();
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
})();
