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
    await page.evaluate(() => {
      document.getElementById('stb-start-btn').click();
    });
    await page.waitForTimeout(1000);
    const isResultEmptyVisible = await page.isVisible('#stb-result-empty');
    const isResultContentVisible = await page.isVisible('#stb-result-content');
    const isAllPickedVisible = await page.isVisible('#stb-all-picked');
    console.log('Result Empty Visible:', isResultEmptyVisible);
    console.log('Result Content Visible:', isResultContentVisible);
    console.log('All Picked Visible:', isAllPickedVisible);
    console.log('Errors:', errors);
  } finally {
    await browser.close();
  }
})();
