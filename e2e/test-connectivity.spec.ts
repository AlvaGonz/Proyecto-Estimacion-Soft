import { test, expect } from '@playwright/test';

test('Test connectivity and loading', async ({ page }) => {
  // Capturar errores de consola ANTES de navegar
  page.on('console', msg => console.log(`BROWSER LOG [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', request => console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`));

  await page.goto('http://localhost:3001');
  
  // Esperar a que el DOM esté listo
  await page.waitForLoadState('domcontentloaded');
  
  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  // Esperar un poco para ver si el JS se ejecuta
  await page.waitForTimeout(10000);
  
  const content = await page.content();
  console.log('Content snippet:', content.substring(0, 500));
  
  const rootContent = await page.locator('#root').innerHTML();
  console.log('Root HTML:', rootContent);
  
  const hasEmail = await page.locator('#email').isVisible();
  console.log('Has #email:', hasEmail);
  
  await page.screenshot({ path: 'playwright-report/connectivity-debug.png' });
});
