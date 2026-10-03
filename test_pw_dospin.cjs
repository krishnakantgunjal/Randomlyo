const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(`Page Error: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`Console Error: ${msg.text()}`);
  });
  await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    try {
      document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
      document.getElementById('stb-start-btn').click();
      await new Promise(r => setTimeout(r, 100));
      document.getElementById('stb-spin-btn').click();
      await new Promise(r => setTimeout(r, 2000));
      return { 
        transform: document.getElementById('stb-bottle-3d').style.transform,
        empty: document.getElementById('stb-result-empty').className,
        content: document.getElementById('stb-result-content').className,
        all: document.getElementById('stb-all-picked').className,
      };
    } catch(e) {
      return e.message;
    }
  });
  console.log("Result:", result);
  console.log("Errors:", errors);
  await browser.close();
})();
