const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
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
  
  // Click the first sentence
  const spans = await page.$$('.highlight-sentence');
  if (spans.length > 0) {
    console.log("Clicking the first sentence...");
    await spans[0].click();
    
    // Check if sentence-feedback-card is visible
    const isFeedbackVisible = await page.$eval('#sentence-feedback-card', el => !el.classList.contains('hidden'));
    const isMetricsHidden = await page.$eval('#metrics-card', el => el.classList.contains('hidden'));
    
    console.log("Sentence feedback card visible:", isFeedbackVisible);
    console.log("Metrics card hidden:", isMetricsHidden);
    
    // Check text
    const text = await page.$eval('#feedback-sentence-text', el => el.textContent);
    console.log("Feedback text:", text);
    
    // Click close
    await page.click('#btn-close-sentence-card');
    const isFeedbackVisibleAfterClose = await page.$eval('#sentence-feedback-card', el => !el.classList.contains('hidden'));
    console.log("Feedback visible after close:", isFeedbackVisibleAfterClose);
  } else {
    console.log("No sentences found!");
  }
  
  await browser.close();
})();
