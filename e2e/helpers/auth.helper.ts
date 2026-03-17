import { Page } from '@playwright/test';

export const USERS = {
  facilitator: { email: 'aalvarez@uce.edu.do', password: 'password123', role: 'Facilitador' },
  expert:      { email: 'expert1@uce.edu.do',  password: 'password123', role: 'Experto' },
} as const;

/**
 * Hace login y SIEMPRE dismissea el OnboardingModal si aparece.
 * Todos los tests deben usar esta función — nunca hacer login manual.
 */
export async function loginAs(page: Page, user: keyof typeof USERS) {
  await page.goto('/');
  const creds = USERS[user];
  
  // Esperar a que el formulario esté listo
  await page.getByLabel(/correo institucional/i).waitFor({ state: 'visible', timeout: 10_000 });
  
  await page.getByLabel(/correo institucional/i).fill(creds.email);
  await page.getByLabel(/contraseña/i).fill(creds.password);
  await page.getByRole('button', { name: /ingresar al sistema/i }).click();
  
  // Esperar navegación o error
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
  
  // ── Dismiss OnboardingModal si aparece ─────────────────────────────────────
  await dismissOnboardingIfPresent(page);
}

/**
 * Cierra el OnboardingModal si está presente.
 * Safe — no falla si el modal no aparece (usuario ya completó onboarding).
 */
export async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  // El modal tiene hasta 3 segundos para aparecer post-login
  const modal = page.locator('[aria-labelledby="onboarding-title"]');
  const modalVisible = await modal.isVisible().catch(() => false);

  if (!modalVisible) {
    // Esperar brevemente por si el modal tarda en renderizar
    await page.waitForTimeout(800);
    const modalVisibleAfterWait = await modal.isVisible().catch(() => false);
    if (!modalVisibleAfterWait) return; // No hay modal — continuar
  }

  // ── Estrategia 1: Botón de cierre por texto ────────────────────────────────
  const closeButtonSelectors = [
    page.getByRole('button', { name: /saltar/i }),        // Botón "Saltar" en footer
    page.getByLabel('Cerrar tour'),                       // Botón X en header
    page.getByRole('button', { name: /finalizar/i }),     // Botón Finalizar en último paso
  ];

  for (const selector of closeButtonSelectors) {
    const isVisible = await selector.isVisible().catch(() => false);
    if (isVisible) {
      await selector.click();
      // Esperar que el modal desaparezca del DOM
      await modal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
      return;
    }
  }

  // ── Estrategia 2: Tecla Escape como fallback ──────────────────────────────
  await page.keyboard.press('Escape');
  await modal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

  // ── Estrategia 3: localStorage — marcar onboarding como completado ─────────
  const stillVisible = await modal.isVisible().catch(() => false);
  if (stillVisible) {
    await page.evaluate(() => {
      localStorage.setItem('onboarding_complete', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  }
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
