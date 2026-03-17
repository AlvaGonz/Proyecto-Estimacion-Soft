import { Page } from '@playwright/test';

export const USERS = {
  facilitator: { email: 'aalvarez@uce.edu.do', password: 'password123', role: 'Facilitador' },
  expert:      { email: 'expert1@uce.edu.do',  password: 'password123', role: 'Experto' },
  admin:       { email: 'admin@uce.edu.do',     password: 'password123', role: 'Admin' },
} as const;

/**
 * Navega al home y verifica que la sesión está activa.
 * Con storageState global, NO necesita hacer el flujo de login.
 * Si la sesión expiró (edge case), hace login completo.
 */
export async function loginAs(page: Page, _user: keyof typeof USERS = 'facilitator') {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Verificar si ya estamos autenticados (el sidebar de la app está visible)
  const isAuthenticated = await page
    .getByRole('button', { name: /proyectos/i })
    .isVisible({ timeout: 3_000 })
    .catch(() => false);

  if (!isAuthenticated) {
    // Sesión no activa — hacer login completo
    const creds = USERS[_user];
    await page.getByLabel(/correo institucional/i).fill(creds.email);
    await page.getByLabel(/contraseña/i).fill(creds.password);
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();
    await page.waitForLoadState('networkidle');
  }

  // Siempre dismissar onboarding si aparece
  await dismissOnboardingIfPresent(page);
}

export async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  const modalSelector = '[aria-labelledby="onboarding-title"]';
  
  // Esperar un momento corto por si el modal está apareciendo (animación)
  const isVisible = await page.locator(modalSelector).isVisible({ timeout: 2000 }).catch(() => false);
  if (!isVisible) return;

  const closeNames = ['Comenzar', 'Entendido', 'Saltar', 'Cerrar', 'Continuar', 'Completar'];
  for (const name of closeNames) {
    const btn = page.getByRole('button', { name: new RegExp(name, 'i') });
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.locator(modalSelector).waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
      return;
    }
  }
  await page.keyboard.press('Escape');
  await page.locator(modalSelector).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
}

export async function loginAndGoTo(page: Page, user: keyof typeof USERS, section: string) {
  await loginAs(page, user);
  if (section === 'proyectos') {
    await page.getByRole('button', { name: /proyectos/i }).click();
  } else if (section === 'dashboard') {
    await page.getByRole('button', { name: /dashboard/i }).click();
  }
  await page.waitForLoadState('networkidle');
}
