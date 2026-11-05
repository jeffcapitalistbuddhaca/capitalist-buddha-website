const { chromium } = require('playwright');

async function checkFooterAlignment() {
  console.log('🔍 Checking footer alignment and layout...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Check footer properties
    const footer = await page.$('footer');
    if (!footer) {
      console.log('❌ Footer not found');
      return false;
    }

    const footerBox = await footer.boundingBox();
    const windowWidth = await page.evaluate(() => window.innerWidth);

    console.log('DESKTOP (1920x1080):');
    console.log(`  Footer x-position: ${footerBox.x}px`);
    console.log(`  Footer width: ${footerBox.width}px`);
    console.log(`  Window width: ${windowWidth}px`);
    console.log(`  Footer reaches left edge: ${footerBox.x <= 1 ? '✓ YES' : '✗ NO (gap of ' + footerBox.x + 'px)'}`);
    console.log(`  Footer reaches right edge: ${footerBox.x + footerBox.width >= windowWidth - 1 ? '✓ YES' : '✗ NO'}`);

    // Check background
    const bgColor = await page.$eval('footer', el =>
      window.getComputedStyle(el).backgroundColor
    );
    console.log(`  Background color: ${bgColor}`);

    // Check z-index
    const zIndex = await page.$eval('footer', el =>
      window.getComputedStyle(el).zIndex
    );
    console.log(`  Z-index: ${zIndex}`);

    // Check if elements are properly layered
    const mainContainer = await page.$('main.container');
    const mainBox = await mainContainer.boundingBox();
    console.log(`\n  Main container x-position: ${mainBox.x}px`);
    console.log(`  Main container width: ${mainBox.width}px`);

    // Verify header is visible at top
    const header = await page.$('.cb-header');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    const headerBox = await header.boundingBox();
    console.log(`\nHEADER:
  Height: ${headerBox.height}px (expected ~72px)
  x-position: ${headerBox.x}px`);

    // Check for layout issues
    const hasOverflow = await page.evaluate(() =>
      document.body.scrollWidth > window.innerWidth
    );
    console.log(`\n  Unwanted horizontal scroll: ${hasOverflow ? '✗ YES' : '✓ NO'}`);

    console.log('\n✅ Layout check complete');
    await browser.close();
    return true;

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    await browser.close();
    return false;
  }
}

checkFooterAlignment().then(success => {
  process.exit(success ? 0 : 1);
});
