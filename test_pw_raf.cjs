const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
    document.getElementById('stb-start-btn').click();
    await new Promise(r => setTimeout(r, 100));
    window.__frameCalled = 0;
    const orig = requestAnimationFrame;
    window.requestAnimationFrame = (fn) => {
      window.__frameCalled++;
      return orig(fn);
    };
    document.getElementById('stb-spin-btn').click();
    await new Promise(r => setTimeout(r, 1000));
    return window.__frameCalled;
  });
  console.log("Frames called:", result);
  await browser.close();
})();
