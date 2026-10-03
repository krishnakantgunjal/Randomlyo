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
    if (errors.length > 0) {
      console.log(errors.join('\n'));
    } else {
      console.log("No errors on load.");
      await page.evaluate(() => {
        document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
        document.getElementById('stb-start-btn').click();
      });
      await page.waitForTimeout(1000);
      if (errors.length > 0) {
        console.log(errors.join('\n'));
      } else {
        console.log("No errors after starting game.");
        await page.evaluate(() => {
          document.getElementById('stb-spin-btn').click();
        });
        await page.waitForTimeout(1000);
        if (errors.length > 0) {
          console.log(errors.join('\n'));
        } else {
          console.log("No errors after clicking spin.");
        }
      }
    }
  } catch (e) {
    console.log("Failed: ", e.message);
  } finally {
    await browser.close();
  }
})();
