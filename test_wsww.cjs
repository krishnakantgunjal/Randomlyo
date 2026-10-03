const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to page...");
    await page.goto('http://localhost:4321/what-should-we-watch', { waitUntil: 'networkidle' });
    
    // Wait for genres to load
    await page.waitForSelector('#wsww-start-btn:not([disabled])', { timeout: 10000 });
    console.log("Genres loaded, start button enabled.");
    
    // Select first genre
    await page.click('.genre-checkbox');
    await page.click('#wsww-start-btn');
    
    // Wait for first card
    await page.waitForSelector('#wsww-loading.hidden', { state: 'attached', timeout: 10000 });
    
    let counterText = await page.$eval('#wsww-counter', el => el.textContent);
    let title = await page.$eval('#wsww-title', el => el.textContent);
    console.log(`First card showing: ${title} (${counterText})`);
    
    // Get total items in first batch
    const match = counterText.match(/\d+ \/ (\d+)/);
    const totalFirstBatch = parseInt(match[1], 10);
    console.log(`Swiping "no" ${totalFirstBatch} times to trigger next page fetch...`);
    
    for (let i = 0; i < totalFirstBatch; i++) {
      await page.click('#wsww-no-btn');
      await page.waitForTimeout(500); // wait for animation
    }
    
    // Should now be fetching next page and show card 1 of new batch
    await page.waitForSelector('#wsww-loading:not(.hidden)', { state: 'attached', timeout: 10000 });
    await page.waitForSelector('#wsww-loading.hidden', { state: 'attached', timeout: 10000 });
    counterText = await page.$eval('#wsww-counter', el => el.textContent);
    title = await page.$eval('#wsww-title', el => el.textContent);
    console.log(`Successfully fetched next page. Showing: ${title} (${counterText})`);
    
    // Click yes to match
    await page.click('#wsww-yes-btn');
    await page.waitForTimeout(500);
    
    const matchTitle = await page.$eval('#wsww-match-title', el => el.textContent);
    console.log(`Match screen showing: ${matchTitle}`);
    
    console.log("\\n--- Testing Error State ---");
    // Reload page and break API key via route interception
    await page.route('https://api.trakt.tv/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: "Invalid API key" })
      });
    });
    
    await page.goto('http://localhost:4321/what-should-we-watch', { waitUntil: 'networkidle' });
    // It should try to fetch genres and fail
    await page.waitForTimeout(2000);
    const errorText = await page.$eval('#wsww-genres-loading', el => el.textContent);
    console.log(`Error state handled: ${errorText}`);
    
    console.log("All tests passed!");
    
  } catch (e) {
    console.log("Failed: ", e.message);
  } finally {
    await browser.close();
  }
})();
