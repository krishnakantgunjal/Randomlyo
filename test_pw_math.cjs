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
    
    const numTests = 15;
    let passed = 0;
    
    for (let i = 0; i < numTests; i++) {
      const winnerName = await page.evaluate(async () => {
        document.getElementById('stb-spin-btn').click();
        await new Promise(r => setTimeout(r, 4500)); // wait for spin
        return document.getElementById('stb-winner-name').textContent;
      });
      
      const transform = await page.$eval('.stb-bottle-3d', el => el.style.transform);
      const match = transform.match(/rotateZ\(([-.0-9]+)deg\)/);
      if (!match) {
        console.log(`Test ${i}: Could not read transform: ${transform}`);
        continue;
      }
      
      const finalAngle = parseFloat(match[1]);
      const normalizedAngle = ((finalAngle % 360) + 360) % 360;
      
      const neckAngle = (normalizedAngle - 90 + 360) % 360; // Base -90
      
      const players = ['Alice', 'Bob', 'Charlie', 'Diana'];
      const winnerIdx = players.indexOf(winnerName);
      const expectedTarget = (-90 + (360 / 4) * winnerIdx + 360) % 360;
      const expectedNeckAngle = (-90 + expectedTarget + 360) % 360; // neckAngle relative
      
      // Let's just compare what we expect. 
      // Alice = -90 (neck at 270 deg) => normalizedAngle = 0
      // Bob = 0 (neck at 0 deg) => normalizedAngle = 90
      // Charlie = 90 (neck at 90) => normalizedAngle = 180
      // Diana = 180 (neck at 180) => normalizedAngle = 270
      let expectedFinal = 0;
      if (winnerName === 'Alice') expectedFinal = 0;
      else if (winnerName === 'Bob') expectedFinal = 90;
      else if (winnerName === 'Charlie') expectedFinal = 180;
      else if (winnerName === 'Diana') expectedFinal = 270;
      
      const diff = Math.abs(normalizedAngle - expectedFinal);
      const isMatch = diff < 1 || Math.abs(diff - 360) < 1;
      
      console.log(`Spin ${i + 1}: Winner='${winnerName}', Transform='${transform}', NormalizedAngle=${normalizedAngle}°, Expected=${expectedFinal}° -> ${isMatch ? 'PASS' : 'FAIL'}`);
      if (isMatch) passed++;
      
      await page.evaluate(() => {
        document.getElementById('stb-spin-again-btn').click();
      });
      await page.waitForTimeout(500);
    }
    console.log(`\nResults: ${passed}/${numTests} spins landed accurately.`);
    
  } catch (e) {
    console.log("Failed: ", e.message);
  } finally {
    await browser.close();
  }
})();
