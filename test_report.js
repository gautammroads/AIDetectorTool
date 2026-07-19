const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Type text
  await page.type('#text-input', 'This is a test sentence that is quite long to ensure it meets the character limit. We need at least one hundred characters to perform an analysis. AI generated text is sometimes easy to spot, but not always. We hope this works.');
  
  // Click analyze
  await page.click('#btn-analyze-text');
  
  // Wait for overlay to disappear
  await page.waitForFunction(() => {
    const overlay = document.querySelector('#scan-progress-overlay');
    return !overlay.classList.contains('active');
  }, { timeout: 10000 });
  
  // Wait a bit for render
  await new Promise(r => setTimeout(r, 500));
  
  console.log("Clicking Download Report...");
  await page.click('#btn-export-report');
  
  // Wait a bit to see if modal opens
  await new Promise(r => setTimeout(r, 500));
  
  const isModalOpen = await page.evaluate(() => {
    const modal = document.querySelector('#modal-report-details');
    return modal && modal.open;
  });
  console.log("Is Modal Open?", isModalOpen);
  
  if (isModalOpen) {
    console.log("Clicking Print...");
    // Mock window.print
    await page.evaluate(() => {
      window.print = () => console.log("WINDOW PRINT CALLED");
    });
    await page.click('#btn-print-report');
    await new Promise(r => setTimeout(r, 500));
  }
  
  await browser.close();
})();
