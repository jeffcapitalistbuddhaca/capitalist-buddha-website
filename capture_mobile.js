const { chromium } = require('playwright');
const path = require('path');

const devices = [
  { name: 'iPhone16Pro', width: 393, height: 852 },
  { name: 'iPhone16', width: 375, height: 812 },
  { name: 'SamsungS24', width: 360, height: 800 },
  { name: 'OnePlus12', width: 440, height: 956 },
  { name: 'Pixel9Pro', width: 512, height: 1024 }
];

const pages = [
  { id: 'courses', label: 'Courses' },
  { id: 'professor', label: 'Professor' },
  { id: 'login', label: 'Login' },
  { id: 'book', label: 'CourseText' },
  { id: 'contact', label: 'Contact' }
];

const outputDir = 'sandbox/pending';

(async () => {
  const browser = await chromium.launch();
  let count = 0;

  try {
    for (const device of devices) {
      for (const page of pages) {
        try {
          const pageInstance = await browser.newPage();
          await pageInstance.setViewportSize({ width: device.width, height: device.height });
          await pageInstance.goto('http://localhost:8888', { waitUntil: 'load', timeout: 10000 });
          await pageInstance.waitForTimeout(500);

          if (page.id !== 'courses') {
            await pageInstance.click(`[data-tab="${page.id}"]`);
            await pageInstance.waitForTimeout(500);
          }

          count++;
          const filename = `${String(count).padStart(2, '0')}_${device.name}_${page.label}_mobile.png`;
          const filepath = path.join(outputDir, filename);

          await pageInstance.screenshot({
            path: filepath,
            fullPage: true
          });

          console.log(`✅ ${filename}`);
          await pageInstance.close();
        } catch (error) {
          console.error(`❌ ${device.name} ${page.label}: ${error.message}`);
          count++;
        }
      }
    }

    console.log(`\n✅ Mobile screenshots complete (${count} total)`);
  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await browser.close();
  }
})();
