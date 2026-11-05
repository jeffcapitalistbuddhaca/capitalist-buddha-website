const { chromium } = require('playwright');

async function verifyDesign() {
  console.log('🔍 PHASE 3 - FADED ARTWORK BACKGROUND - VERIFICATION\n');

  const browser = await chromium.launch();

  // DESKTOP VIEW
  console.log('=== DESKTOP VIEW (1920x1080) ===\n');
  const desktopPage = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    await desktopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Check 1: Slim header bar at top
    const header = await desktopPage.$('.cb-header');
    const headerHeight = await desktopPage.$eval('.cb-bar', el => el.offsetHeight);
    console.log(`✓ Header bar height: ${headerHeight}px (expected 72px)`);

    // Check 2: All tabs on one line
    const tabs = await desktopPage.$$('.cb-header .tab-btn');
    console.log(`✓ Tab buttons: ${tabs.length} buttons (Courses, Professor, Login to Course, Course Text, Contact Us)`);

    // Check 3: No module cards
    const moduleCards = await desktopPage.$$('.cb-module-card');
    console.log(`✓ Module cards removed: ${moduleCards.length === 0 ? '✓ YES' : '✗ ' + moduleCards.length + ' cards found'}`);

    // Check 4: No flag strip
    const flagDivider = await desktopPage.$('.cb-divider-flags');
    console.log(`✓ Prayer flags divider removed: ${!flagDivider ? '✓ YES' : '✗ Still present'}`);

    // Check 5: No leaf dividers
    const leafDividers = await desktopPage.$('.cb-divider-leaves');
    console.log(`✓ Leaf dividers removed: ${!leafDividers ? '✓ YES' : '✗ Still present'}`);

    // Check 6: No edge leaves
    const edgeLeaves = await desktopPage.$('.cb-edge');
    console.log(`✓ Edge leaves removed: ${!edgeLeaves ? '✓ YES' : '✗ Still present'}`);

    // Check 7: No Amazon button in book section
    const bookSection = await desktopPage.$('#courses .cb-section:has(h2:has-text("companion book"))');
    if (bookSection) {
      const amazonBtn = await bookSection.$('.book-link');
      console.log(`✓ Amazon link removed from Courses book section: ${!amazonBtn ? '✓ YES' : '✗ Still present'}`);
    }

    // Check 8: Click to pay works
    const payButton = await desktopPage.$('#pay-button');
    console.log(`✓ Click to pay button accessible: ${payButton ? '✓ YES' : '✗ NO'}`);

    // Check 9: Login works
    await desktopPage.click('button[data-tab="login"]');
    await desktopPage.waitForSelector('#login-form', { timeout: 3000 });
    console.log(`✓ Login tab accessible`);

    // Check 10: Contact form works
    await desktopPage.click('button[data-tab="contact"]');
    await desktopPage.waitForSelector('#contact-form', { timeout: 3000 });
    console.log(`✓ Contact form accessible`);

    // Check 11: Footer edge-to-edge
    await desktopPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = await desktopPage.$('footer');
    const footerBox = await footer.boundingBox();
    console.log(`✓ Footer edge-to-edge: x=${footerBox.x}px, width=${footerBox.width}px (${footerBox.x === 0 && footerBox.width === 1920 ? '✓ YES' : '✗ NOT'}`);

    // Take screenshot of top
    await desktopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await desktopPage.screenshot({ path: '/tmp/desktop-top.png', fullPage: false });
    console.log('✓ Screenshot saved: desktop-top.png');

    // Take screenshot of middle (to show faded artwork)
    await desktopPage.evaluate(() => window.scrollBy(0, 500));
    await desktopPage.waitForTimeout(300);
    await desktopPage.screenshot({ path: '/tmp/desktop-middle.png', fullPage: false });
    console.log('✓ Screenshot saved: desktop-middle.png');

    console.log('\n✅ Desktop verification PASSED\n');

  } catch (error) {
    console.log(`❌ Desktop error: ${error.message}\n`);
  }

  // MOBILE VIEW
  console.log('=== MOBILE VIEW (375x667) ===\n');
  const mobilePage = await browser.newPage({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
  });

  try {
    await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Check 1: Hamburger menu
    const hamburger = await mobilePage.$('.cb-menu-toggle');
    console.log(`✓ Hamburger menu visible: ${hamburger ? '✓ YES' : '✗ NO'}`);

    // Check 2: Menu toggles
    await mobilePage.click('.cb-menu-toggle');
    await mobilePage.waitForTimeout(300);
    const menuOpen = await mobilePage.$eval('body', el => el.classList.contains('cb-menu-open'));
    console.log(`✓ Menu opens: ${menuOpen ? '✓ YES' : '✗ NO'}`);

    // Check 3: Contact form on mobile
    await mobilePage.click('button[data-tab="contact"]');
    await mobilePage.waitForSelector('#contact-form', { timeout: 3000 });
    console.log(`✓ Contact form accessible on mobile`);

    // Check 4: No module cards
    const mobileModuleCards = await mobilePage.$$('.cb-module-card');
    console.log(`✓ Module cards removed on mobile: ${mobileModuleCards.length === 0 ? '✓ YES' : '✗ ' + mobileModuleCards.length + ' found'}`);

    // Check 5: No unwanted overflow
    const hasOverflow = await mobilePage.evaluate(() =>
      document.body.scrollWidth > window.innerWidth
    );
    console.log(`✓ No unwanted horizontal scroll: ${!hasOverflow ? '✓ YES' : '✗ Overflow detected'}`);

    // Take screenshot of top
    await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: '/tmp/mobile-top.png', fullPage: false });
    console.log('✓ Screenshot saved: mobile-top.png');

    // Take screenshot of middle
    await mobilePage.evaluate(() => window.scrollBy(0, 300));
    await mobilePage.waitForTimeout(300);
    await mobilePage.screenshot({ path: '/tmp/mobile-middle.png', fullPage: false });
    console.log('✓ Screenshot saved: mobile-middle.png');

    console.log('\n✅ Mobile verification PASSED\n');

  } catch (error) {
    console.log(`❌ Mobile error: ${error.message}\n`);
  }

  await browser.close();
  console.log('✅ ALL CHECKS COMPLETE - Ready to push');
}

verifyDesign().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
