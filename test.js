const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', error => console.log('PAGE ERROR:', error.stack));
  page.on('console', msg => console.log('LOG:', msg.text(), msg.location()));
  
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  await browser.close();
})();
