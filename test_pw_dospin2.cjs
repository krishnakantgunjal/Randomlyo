const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
    document.getElementById('stb-start-btn').click();
    await new Promise(r => setTimeout(r, 100));
    window.__doSpinCalled = false;
    const btn = document.getElementById('stb-spin-btn');
    btn.addEventListener('click', () => { window.__doSpinCalled = true; });
    btn.click();
    return { called: window.__doSpinCalled, disabled: btn.disabled };
  });
  console.log("doSpin listener called?", result.called);
  console.log("button disabled?", result.disabled);
  await browser.close();
})();
