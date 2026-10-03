const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
    document.getElementById('stb-start-btn').click();
  });
  await page.waitForTimeout(500);
  console.log("Button disabled before click:", await page.$eval('#stb-spin-btn', el => el.disabled));
  await page.evaluate(() => {
    document.getElementById('stb-spin-btn').click();
  });
  await page.waitForTimeout(500);
  console.log("Button disabled after click:", await page.$eval('#stb-spin-btn', el => el.disabled));
  await browser.close();
})();
