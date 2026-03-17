import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Pre-configurar localStorage para deshabilitar onboarding en todos los tests
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto(config.projects[0]?.use?.baseURL ?? 'http://localhost:5173');
  
  // Marcar onboarding como completado antes de cualquier test
  await page.evaluate(() => {
    localStorage.setItem('onboarding_complete', 'true');
  });
  
  await browser.close();
}

export default globalSetup;
