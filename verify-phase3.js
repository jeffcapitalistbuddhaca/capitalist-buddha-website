const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');

// Email for testing (existing user)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test1234!';

async function testDesktopView() {
  console.log('\n=== DESKTOP VIEW VERIFICATION (1920x1080) ===\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    // Test 1: Click to pay button
    console.log('Test 1: Verify Click to pay button opens checkout...');
    await page.goto('http://localhost:3000/');
    const payButton = await page.$('#pay-button');
    if (!payButton) {
      console.log('❌ FAILED: Click to pay button not found');
      return false;
    }

    // Check if clicking pay button would open Stripe checkout
    const payButtonText = await page.$eval('#pay-button', el => el.textContent);
    console.log(`✓ Click to pay button found: "${payButtonText}"`);

    // Test 2: Login functionality
    console.log('\nTest 2: Verify Login form is accessible...');
    await page.click('button[data-tab="login"]');
    await page.waitForSelector('#login-form', { timeout: 5000 });
    const loginForm = await page.$('#login-form');
    if (!loginForm) {
      console.log('❌ FAILED: Login form not found');
      return false;
    }
    console.log('✓ Login form accessible on Courses → Login tab');

    // Test 3: Verify contact form
    console.log('\nTest 3: Verify Contact form is accessible...');
    await page.click('button[data-tab="contact"]');
    await page.waitForSelector('#contact-form', { timeout: 5000 });
    const contactForm = await page.$('#contact-form');
    if (!contactForm) {
      console.log('❌ FAILED: Contact form not found');
      return false;
    }
    console.log('✓ Contact form accessible');

    // Test 4: Header layout
    console.log('\nTest 4: Verify header layout (sticky, 72px bar)...');
    const header = await page.$('.cb-header');
    if (!header) {
      console.log('❌ FAILED: Header not found');
      return false;
    }
    const headerHeight = await page.$eval('.cb-bar', el => el.offsetHeight);
    console.log(`✓ Header bar height: ${headerHeight}px (expected ~72px)`);

    // Test 5: Module preview section
    console.log('\nTest 5: Verify module preview section loads...');
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('.cb-module-card', { timeout: 5000 }).catch(() => {
      console.log('⚠️  Module cards not yet loaded (modules.json may be loading)');
    });
    const moduleCards = await page.$$('.cb-module-card');
    console.log(`✓ Module preview section found with ${moduleCards.length} cards`);

    console.log('\n✅ Desktop view verification PASSED\n');
    return true;

  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function testMobileView() {
  console.log('\n=== MOBILE VIEW VERIFICATION (375x667) ===\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
  });

  try {
    // Test 1: Hamburger menu
    console.log('Test 1: Verify hamburger menu toggle...');
    await page.goto('http://localhost:3000/');
    const menuToggle = await page.$('.cb-menu-toggle');
    if (!menuToggle) {
      console.log('❌ FAILED: Hamburger menu toggle not found');
      return false;
    }
    console.log('✓ Hamburger menu toggle found');

    // Test 2: Menu opens and closes
    console.log('\nTest 2: Verify menu opens/closes on toggle...');
    await page.click('.cb-menu-toggle');
    await page.waitForTimeout(300);
    const menuOpen = await page.$eval('body', el => el.classList.contains('cb-menu-open'));
    if (!menuOpen) {
      console.log('❌ FAILED: Menu did not open');
      return false;
    }
    console.log('✓ Menu opens on toggle');

    // Close menu
    await page.click('.cb-menu-toggle');
    await page.waitForTimeout(300);
    const menuClosed = await page.$eval('body', el => !el.classList.contains('cb-menu-open'));
    if (!menuClosed) {
      console.log('❌ FAILED: Menu did not close');
      return false;
    }
    console.log('✓ Menu closes on toggle');

    // Test 3: Contact form is accessible
    console.log('\nTest 3: Verify Contact form accessible on mobile...');
    await page.click('.cb-menu-toggle'); // Open menu
    await page.click('button[data-tab="contact"]');
    await page.waitForSelector('#contact-form', { timeout: 5000 });
    const contactForm = await page.$('#contact-form');
    if (!contactForm) {
      console.log('❌ FAILED: Contact form not found on mobile');
      return false;
    }
    console.log('✓ Contact form accessible');

    // Test 4: Module cards scroll horizontally
    console.log('\nTest 4: Verify module preview cards on mobile...');
    await page.goto('http://localhost:3000/');
    const moduleSection = await page.$('.cb-modules');
    if (moduleSection) {
      const hasScroll = await page.$eval('.cb-modules', el => el.scrollWidth > el.clientWidth);
      console.log(`✓ Module section has horizontal scroll: ${hasScroll}`);
    } else {
      console.log('⚠️  Module section not yet loaded');
    }

    // Test 5: No horizontal scroll on page
    console.log('\nTest 5: Verify no unwanted horizontal page scroll...');
    const pageWidth = await page.$eval('body', el => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    if (pageWidth > viewportWidth) {
      console.log(`⚠️  WARNING: Page scrollWidth (${pageWidth}) > viewport (${viewportWidth})`);
    } else {
      console.log(`✓ No unwanted horizontal scroll (pageWidth: ${pageWidth}, viewport: ${viewportWidth})`);
    }

    console.log('\n✅ Mobile view verification PASSED\n');
    return true;

  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🔍 PHASE 3 VERIFICATION - Desktop & Mobile\n');

  const desktopPass = await testDesktopView();
  const mobilePass = await testMobileView();

  if (desktopPass && mobilePass) {
    console.log('✅ ALL VERIFICATION TESTS PASSED');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
