import { Page, expect } from '@playwright/test';

export const USERS = {
  facilitator: { email: 'aalvarez@uce.edu.do', password: 'password123', role: 'facilitador' },
  expert: { email: 'e2e.expert1@uce.edu.do', password: 'TestPass1', role: 'experto' },
  expert1: { email: 'e2e.expert1@uce.edu.do', password: 'TestPass1', role: 'experto' },
  expert2: { email: 'e2e.expert2@uce.edu.do', password: 'TestPass1', role: 'experto' },
  expert3: { email: 'e2e.expert3@uce.edu.do', password: 'TestPass1', role: 'experto' },
  expert4: { email: 'e2e.expert4@uce.edu.do', password: 'TestPass1', role: 'experto' },
  expert5: { email: 'e2e.expert5@uce.edu.do', password: 'TestPass1', role: 'experto' },
  admin: { email: 'admin@uce.edu.do', password: 'password123', role: 'admin' },
} as const;

/**
 * Navega al home y verifica que la sesión está activa para el usuario solicitado.
 */
export async function loginAs(page: Page, _user: keyof typeof USERS = 'facilitator') {
  // Always inject the onboarding_complete flag into localStorage before doing anything
  await page.addInitScript(() => {
    window.localStorage.setItem('onboarding_complete', 'true');
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const creds = USERS[_user];

  // Verificar si ya estamos autenticados con el usuario CORRECTO
  // Buscamos el email en el sidebar/perfil
  const currentEmailVisible = await page.getByText(creds.email).isVisible({ timeout: 2_000 }).catch(() => false);

  // Buscar el título del Dashboard, o la navegación (puede ser link o button)
  const visibles = await Promise.all([
    page.getByRole('heading', { name: /dashboard/i }).isVisible({ timeout: 1_000 }).catch(() => false),
    page.getByRole('button', { name: /proyectos/i }).isVisible({ timeout: 1_000 }).catch(() => false),
    page.getByRole('link', { name: /proyectos/i }).isVisible({ timeout: 1_000 }).catch(() => false),
    page.getByRole('button', { name: /cerrar sesión/i }).isVisible({ timeout: 1_000 }).catch(() => false)
  ]);
  const isDashboardOrSidebarVisible = visibles.some(v => v);

  if (!currentEmailVisible) {
    // Si no somos el usuario correcto, forzamos limpieza
    await page.context().clearCookies();
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/', { waitUntil: 'load', timeout: 15_000 }).catch(() => { });

    // Sesión no activa o usuario incorrecto — hacer login completo
    await page.locator('#email').waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('#email').fill(creds.email);
    await page.locator('#password').fill(creds.password);
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();

    // SPA: no hay navegación real, esperamos a un indicador de éxito
    await expect(
      page.getByRole('button', { name: /proyectos|sesiones/i })
        .or(page.getByRole('link', { name: /proyectos|sesiones/i }))
        .or(page.getByRole('heading', { name: /dashboard|Panel del Experto|Métrica General/i }))
        .first()
    ).toBeVisible({ timeout: 15_000 });
  } else {
    // User is already logged in via cookies — set the auth flag in localStorage
    // This ensures the app's auth check finds the flag on reload
    await page.evaluate(() => {
      window.localStorage.setItem('estimapro_auth', 'true');
    });
  }

  // Dismissal via UI is no longer needed since we inject the flag via addInitScript
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
      await page.locator(modalSelector).waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => { });
      return;
    }
  }
  await page.keyboard.press('Escape');
  await page.locator(modalSelector).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => { });
}

export async function loginAndGoTo(page: Page, user: keyof typeof USERS, section: string) {
  await loginAs(page, user);

  const viewport = page.viewportSize();
  if (viewport && viewport.width < 1024) {
    await page.getByLabel('Abrir menú').click();
    await page.locator('aside').first().waitFor({ state: 'visible', timeout: 3_000 });
  }

  if (section === 'proyectos') {
    await page.getByRole('button', { name: /proyectos/i }).click();
  } else if (section === 'dashboard') {
    await page.getByRole('button', { name: /dashboard/i }).click();
  }
  await page.waitForLoadState('networkidle');
}
