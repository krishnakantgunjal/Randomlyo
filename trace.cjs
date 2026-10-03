const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
  page.on('pageerror', err => logs.push('PAGE_ERROR: ' + err.message));
  await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
    document.getElementById('stb-start-btn').click();
    await new Promise(r => setTimeout(r, 100));
    
    // Override the button click to trace
    const btn = document.getElementById('stb-spin-btn');
    btn.click();
  });
  await page.waitForTimeout(2000);
  console.log(logs.join('\n'));
  await browser.close();
})();
