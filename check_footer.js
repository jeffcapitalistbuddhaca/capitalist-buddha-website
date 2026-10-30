const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto('http://localhost:8000', { waitUntil: 'load' });
    
    const footerHtml = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      return {
        exists: footer !== null,
        html: footer ? footer.outerHTML.substring(0, 200) : 'no footer',
        display: footer ? window.getComputedStyle(footer).display : 'N/A',
        position: footer ? window.getComputedStyle(footer).position : 'N/A'
      };
    });
    
    console.log('Footer info:', JSON.stringify(footerHtml, null, 2));
    
    // Take a zoomed out screenshot to show more
    await page.setViewportSize({ width: 1280, height: 2800 });
    await page.screenshot({ path: 'sandbox/pending/28-zoomed-out.png' });
    await browser.close();
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
})();
