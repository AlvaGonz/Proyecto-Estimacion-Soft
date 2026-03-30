import { test as base, Page, request } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importante: No mover fuera de e2e/ para que los paths relativos funcionen
const AUTH_DIR = path.join(__dirname, '..', '.auth');
const FACILITATOR_STORAGE = path.join(AUTH_DIR, 'facilitator.json');

export const TEST_USERS = {
  admin:      { email: 'admin@uce.edu.do',        password: 'password123' },
  facilitador:{ email: 'aalvarez@uce.edu.do',     password: 'password123' },
  expert1:    { email: 'e2e.expert1@uce.edu.do',  password: 'TestPass1'  },
} as const;

/**
 * auth.fixture.ts
 * Provee contextos de navegador ya autenticados para diferentes roles.
 */
export const test = base.extend<{
  adminPage: Page;
  facilitadorPage: Page;
  expertPage: Page;
}>({
  adminPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext();
    const apiCtx = await request.newContext({ baseURL: baseURL?.replace('3001', '4000') + '/api/' });
    
    // Login via API
    const res = await apiCtx.post('auth/login', { data: TEST_USERS.admin });
    const setCookie = res.headers()['set-cookie'] ?? '';
    const cookieValue = setCookie.split(';')[0].split('=')[1];

    await context.addCookies([{
      name: 'accessToken',
      value: cookieValue,
      url: baseURL,
      httpOnly: true,
      secure: false, // Local dev
      sameSite: 'Lax',
    }]);

    const page = await context.newPage();
    // Add auth flag to localStorage as the frontend uses it for init check
    await page.addInitScript(() => {
      window.localStorage.setItem('estimapro_auth', 'true');
    });
    await use(page);
    await context.close();
  },

  facilitadorPage: async ({ browser, baseURL }, use) => {
    // Reutilizar storageState de global-setup si existe
    const storageState = fs.existsSync(FACILITATOR_STORAGE) ? FACILITATOR_STORAGE : undefined;
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    
    if (!storageState) {
      // Fallback a login manual o API si no está en cache
      await page.goto(baseURL || 'http://localhost:3001');
      await page.locator('#email').fill(TEST_USERS.facilitador.email);
      await page.locator('#password').fill(TEST_USERS.facilitador.password);
      await page.click('button[type="submit"]'); // Ajustar selector si es necesario
      await page.waitForURL('**/dashboard'); // Ajustar según app
    }
    
    await use(page);
    await context.close();
  },

  expertPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext();
    const apiCtx = await request.newContext({ baseURL: baseURL?.replace('3001', '4000') + '/api/' });
    
    // Login via API
    const res = await apiCtx.post('auth/login', { data: TEST_USERS.expert1 });
    const setCookie = res.headers()['set-cookie'] ?? '';
    const cookieValue = setCookie.split(';')[0].split('=')[1];

    await context.addCookies([{
      name: 'accessToken',
      value: cookieValue,
      url: baseURL,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);

    const page = await context.newPage();
    await page.addInitScript(() => {
      window.localStorage.setItem('estimapro_auth', 'true');
    });
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
