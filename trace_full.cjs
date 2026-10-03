const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
    document.getElementById('stb-start-btn').click();
    await new Promise(r => setTimeout(r, 100));
    document.getElementById('stb-spin-btn').click();
  });
  await page.waitForTimeout(2000);
  await browser.close();
})();
