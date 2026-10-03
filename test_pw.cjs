const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  try {
    await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
    
    console.log("--- CONSOLE OUTPUT ---");
    if (errors.length === 0) {
      console.log("No errors on load.");
      // If no error, try starting a game
      await page.fill('#stb-players-list', 'Alice\nBob\nCharlie\nDiana');
      await page.click('#stb-start-btn');
      await page.waitForTimeout(500);
      if (errors.length === 0) {
        console.log("No errors after clicking Start Game.");
      } else {
        console.log(errors.join('\n'));
      }
    } else {
      console.log(errors.join('\n'));
    }
  } catch (e) {
    console.log("Failed to load page: ", e.message);
  } finally {
    await browser.close();
  }
})();
