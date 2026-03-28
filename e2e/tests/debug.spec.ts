import { test, expect } from '@playwright/test';

test('Debug Login Page @debug', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  await page.goto('http://localhost:3001');
  await page.waitForLoadState('load');
  
  const content = await page.content();
  console.log('PAGE TITLE:', await page.title());
  
  // Take screenshot for visual check (available in artifacts if I could see it)
  await page.screenshot({ path: 'playwright-report/debug-login.png' });
  
  // Check if inputs are ready
  const email = page.locator('#email');
  const pass = page.locator('#password');
  const btn = page.getByRole('button', { name: /ingresar/i });
  
  console.log('EMAIL VISIBLE:', await email.isVisible());
  console.log('PASSWORD VISIBLE:', await pass.isVisible());
  console.log('BUTTON VISIBLE:', await btn.isVisible());
  
  if (await email.isVisible()) {
    await email.fill('aalvarez@uce.edu.do');
    await pass.fill('password123');
    
    // Intercept login call
    const loginResponse = page.waitForResponse(r => r.url().includes('/auth/login'), { timeout: 5000 }).catch(() => null);
    
    await btn.click();
    console.log('Login clicked');
    
    const res = await loginResponse;
    if (res) {
      console.log('LOGIN RESPONSE STATUS:', res.status());
      console.log('LOGIN RESPONSE BODY:', await res.text());
    } else {
      console.log('NO LOGIN RESPONSE DETECTED');
    }
  }
});
