const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
  const isResultEmptyVisible = await page.isVisible('#stb-result-empty');
  const isResultContentVisible = await page.isVisible('#stb-result-content');
  const isAllPickedVisible = await page.isVisible('#stb-all-picked');
  console.log('Result Empty Visible:', isResultEmptyVisible);
  console.log('Result Content Visible:', isResultContentVisible);
  console.log('All Picked Visible:', isAllPickedVisible);
  await browser.close();
})();
