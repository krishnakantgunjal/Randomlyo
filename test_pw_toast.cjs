const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
    document.getElementById('stb-start-btn').click();
    await new Promise(r => setTimeout(r, 100));
    document.getElementById('stb-spin-btn').click();
    await new Promise(r => setTimeout(r, 2000));
    return document.getElementById('stb-toast').className;
  });
  console.log("Toast class:", result);
  await browser.close();
})();
