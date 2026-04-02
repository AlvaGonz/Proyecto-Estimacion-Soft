import { test as base, Page, request } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importante: No mover fuera de e2e/ para que los paths relativos funcionen
const AUTH_DIR = path.join(__dirname, '..', '.auth');
const FACILITATOR_STORAGE = path.join(AUTH_DIR, 'facilitator.json');

const BASE_API_SUFFIX = '/api/';

export const TEST_USERS = {
  admin:      { email: 'admin@uce.edu.do',        password: 'password123' },
  facilitador:{ email: 'aalvarez@uce.edu.do',     password: 'password123' },
  expert1:    { email: 'e2e.expert1@uce.edu.do',  password: 'TestPass1'  },
} as const;

/**
 * Extract the accessToken cookie value from a Set-Cookie header.
 * Throws a descriptive error if the cookie is missing.
 */
function extractAccessToken(setCookieHeader: string, role: string): string {
  if (!setCookieHeader) {
    throw new Error(
      `[Fixture:${role}] No Set-Cookie header received from login API. ` +
      `Verify the backend is running and the credentials are seeded.`
    );
  }
  const match = setCookieHeader.match(/accessToken=([^;]+)/);
  if (!match) {
    throw new Error(
      `[Fixture:${role}] accessToken not found in Set-Cookie header. ` +
      `Received: "${setCookieHeader.substring(0, 120)}..."`
    );
  }
  return match[1];
}

/**
 * Create an authenticated browser context via API login.
 */
async function createAuthenticatedContext(
  browser: import('@playwright/test').Browser,
  baseURL: string | undefined,
  user: { email: string; password: string },
  role: string
): Promise<{ page: Page; context: import('@playwright/test').BrowserContext }> {
  const apiBaseURL = (baseURL ?? 'http://127.0.0.1:3001').replace(/:\d+/, ':4000') + BASE_API_SUFFIX;
  const context = await browser.newContext();
  const apiCtx = await request.newContext({ baseURL: apiBaseURL });

  try {
    const res = await apiCtx.post('auth/login', { data: user });

    if (!res.ok()) {
      const body = await res.text().catch(() => 'N/A');
      throw new Error(
        `[Fixture:${role}] Login API returned ${res.status()} for ${user.email}. Body: ${body}`
      );
    }

    const setCookie = res.headers()['set-cookie'] ?? '';
    const cookieValue = extractAccessToken(setCookie, role);

    await context.addCookies([{
      name: 'accessToken',
      value: cookieValue,
      url: baseURL ?? 'http://127.0.0.1:3001',
      httpOnly: true,
      secure: false, // Local dev
      sameSite: 'Lax',
    }]);
  } finally {
    await apiCtx.dispose();
  }

  const page = await context.newPage();
  // The frontend checks localStorage for this flag before calling /auth/me
  await page.addInitScript(() => {
    window.localStorage.setItem('estimapro_auth', 'true');
    window.localStorage.setItem('onboarding_complete', 'true');
  });

  return { page, context };
}

/**
 * auth.fixture.ts
 * Provee contextos de navegador ya autenticados para diferentes roles.
 */
export const test = base.extend<{
  adminPage: Page;
  facilitadorPage: Page;
  expertPage: Page;
  expert2Page: Page;
}>({
  adminPage: async ({ browser, baseURL }, use) => {
    const { page, context } = await createAuthenticatedContext(
      browser, baseURL, TEST_USERS.admin, 'admin'
    );
    await use(page);
    await context.close();
  },

  facilitadorPage: async ({ browser, baseURL }, use) => {
    // Reutilizar storageState de global-setup si existe
    const storageState = fs.existsSync(FACILITATOR_STORAGE) ? FACILITATOR_STORAGE : undefined;

    if (storageState) {
      const context = await browser.newContext({ storageState });
      const page = await context.newPage();
      await use(page);
      await context.close();
    } else {
      // Fallback: API-based login
      const { page, context } = await createAuthenticatedContext(
        browser, baseURL, TEST_USERS.facilitador, 'facilitador'
      );
      await use(page);
      await context.close();
    }
  },

  expertPage: async ({ browser, baseURL }, use) => {
    const { page, context } = await createAuthenticatedContext(
      browser, baseURL, TEST_USERS.expert1, 'expert'
    );
    await use(page);
    await context.close();
  },

  expert2Page: async ({ browser, baseURL }, use) => {
    const { page, context } = await createAuthenticatedContext(
      browser, baseURL, { email: 'e2e.expert2@uce.edu.do', password: 'TestPass1' }, 'expert2'
    );
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
