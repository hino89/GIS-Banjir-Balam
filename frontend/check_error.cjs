const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  try {
    // Need to login first to access admin?
    // Let's go to login, fill credentials, then navigate to admin
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    
    // Type credentials (assuming superadmin@sigbandar.go.id / admin123 is valid)
    await page.type('input[type="email"]', 'superadmin@sigbandar.go.id');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Now go to daerah rawan
    await page.goto('http://localhost:5173/admin/daerah-rawan', { waitUntil: 'networkidle0' });
    
    // Give it a second to render
    await new Promise(r => setTimeout(r, 1000));
    
  } catch (err) {
    console.log('SCRIPT ERROR:', err.message);
  } finally {
    await browser.close();
  }
})();
