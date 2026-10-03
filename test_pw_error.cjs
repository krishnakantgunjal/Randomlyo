const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
  const log = await page.evaluate(() => {
    document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
    document.getElementById('stb-start-btn').click();
    return document.getElementById('stb-setup-error').textContent;
  });
  console.log("Setup error:", log);
  await browser.close();
})();
