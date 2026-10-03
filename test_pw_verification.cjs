const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to page...");
    await page.goto('http://localhost:4321/play/spin-the-bottle', { waitUntil: 'networkidle' });
    
    // Start game
    await page.evaluate(() => {
      document.getElementById('stb-players-list').value = 'Alice,Bob,Charlie,Diana';
      document.getElementById('stb-start-btn').click();
    });
    await page.waitForTimeout(1000);
    
    // 1. Verify player chips
    console.log("--- 1. PLAYER CHIPS ---");
    const chips = await page.$$('.stb-player-chip');
    console.log(`Found ${chips.length} chips.`);
    for (let i = 0; i < Math.min(3, chips.length); i++) {
      const style = await chips[i].evaluate(el => {
        const computed = window.getComputedStyle(el);
        return { position: computed.position, left: computed.left, top: computed.top, text: el.textContent };
      });
      console.log(`Chip ${i} (${style.text}): position=${style.position}, left=${style.left}, top=${style.top}`);
    }

    // 2. Verify Result Panel (Before Spin)
    console.log("--- 2. RESULT PANEL (BEFORE SPIN) ---");
    let vEmpty = await page.isVisible('#stb-result-empty');
    let vContent = await page.isVisible('#stb-result-content');
    let vAll = await page.isVisible('#stb-all-picked');
    console.log(`Empty visible: ${vEmpty}, Content visible: ${vContent}, AllPicked visible: ${vAll}`);
    
    // 3. Verify Bottle Rotation
    console.log("--- 3. BOTTLE ROTATION ---");
    const initialTransform = await page.$eval('.stb-bottle-3d', el => el.style.transform || 'none');
    console.log(`Initial transform: ${initialTransform}`);
    
    // Click spin
    console.log("Clicking spin...");
    await page.evaluate(() => {
      document.getElementById('stb-spin-btn').click();
    });
    
    // Wait for spin to finish (up to 5s max duration + buffer)
    await page.waitForTimeout(6000);
    
    const finalTransform = await page.$eval('.stb-bottle-3d', el => el.style.transform || 'none');
    console.log(`Final transform: ${finalTransform}`);
    
    // 4. Verify Result Panel (After Spin)
    console.log("--- 4. RESULT PANEL (AFTER SPIN) ---");
    vEmpty = await page.isVisible('#stb-result-empty');
    vContent = await page.isVisible('#stb-result-content');
    vAll = await page.isVisible('#stb-all-picked');
    console.log(`Empty visible: ${vEmpty}, Content visible: ${vContent}, AllPicked visible: ${vAll}`);
    
    // 5. Screenshot
    const screenshotPath = 'C:/Users/krish/.gemini/antigravity-ide/brain/c8a89529-b866-478d-8ee7-94dc4d237271/spin-the-bottle-screenshot.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);

  } catch (e) {
    console.log("Failed: ", e.message);
  } finally {
    await browser.close();
  }
})();
