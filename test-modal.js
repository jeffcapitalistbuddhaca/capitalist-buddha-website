const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to mobile size to match user's issue
  await page.setViewport({ width: 375, height: 812 });
  
  await page.goto('https://capitalistbuddha.ca', { waitUntil: 'networkidle0' });
  
  // Click pay button
  await page.click('#pay-button');
  
  // Wait for modal to appear
  await page.waitForSelector('#payment-modal', { timeout: 5000 });
  
  // Check modal dimensions
  const modalInfo = await page.evaluate(() => {
    const modal = document.getElementById('payment-modal');
    const form = modal.querySelector('form');
    const container = document.getElementById('payment-element-container');
    
    return {
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      formHeight: form.offsetHeight,
      formTop: form.getBoundingClientRect().top,
      formBottom: form.getBoundingClientRect().bottom,
      containerHeight: container?.offsetHeight,
      isFormCutOff: form.getBoundingClientRect().top < 0 || form.getBoundingClientRect().bottom > window.innerHeight
    };
  });
  
  console.log('Modal Test Results:');
  console.log(JSON.stringify(modalInfo, null, 2));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/payment-modal.png' });
  console.log('Screenshot saved to /tmp/payment-modal.png');
  
  await browser.close();
})();
