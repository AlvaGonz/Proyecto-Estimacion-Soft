import { Page } from '@playwright/test';
import { PRIMARY_E2E_EXPERT } from './experts.helper.js';

export async function createProjectViaWizard(
  page: Page,
  opts: {
    name?: string;
    description?: string;
    method?: string;
    unit?: string;
  } = {}
): Promise<string> {
  const name        = opts.name        ?? `Proyecto E2E ${Date.now()}`;
  const description = opts.description ?? 'Proyecto creado automáticamente por Playwright E2E';
  const method      = opts.method      ?? 'Wideband Delphi';
  const unit        = opts.unit        ?? 'Horas';

  // ── Abrir wizard ─────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: /nueva sesión/i }).first().click();
  await page.waitForSelector('#projectName', { timeout: 8_000 });

  // ── Step 1 — Identidad ───────────────────────────────────────────────────────
  await page.locator('#projectName').fill(name);
  await page.locator('#projectDesc').fill(description);
  await page.getByRole('button', { name: /siguiente/i }).first().click();
  await page.waitForTimeout(400);

  // ── Step 2 — Método de estimación ────────────────────────────────────────────
  await page.getByText(new RegExp(method, 'i')).first().click();
  await page.getByRole('button', { name: /siguiente/i }).first().click();
  await page.waitForTimeout(400);

  // ── Step 3 — Unidad / Métrica ────────────────────────────────────────────────
  await page.getByText(new RegExp(unit, 'i')).first().click();
  await page.getByRole('button', { name: /siguiente/i }).first().click();
  await page.waitForTimeout(1_000); // dar tiempo al API call de expertos

  // ── Step 4 — Asignar Panel de Expertos ───────────────────────────────────────
  // Esperar que la sección de expertos cargue completamente
  await page.waitForSelector('h4:has-text("Asignar Panel"), h4:has-text("Panel de Expertos"), text=/asignar panel|panel de expertos/i', {
    timeout: 8_000,
  });

  // Aumentar tiempo de espera al API call — la cookie httpOnly tarda en propagarse
  await page.waitForTimeout(2_000);

  // Verificar expertos cargados — fallar con mensaje claro y screenshot si no
  const noExperts = await page.getByText(/no hay expertos registrados/i)
    .isVisible({ timeout: 1_000 }).catch(() => false);

  if (noExperts) {
    // Capturar screenshot para debug
    await page.screenshot({ path: 'playwright-report/step4-no-experts.png' });
    throw new Error(
      '[createProjectViaWizard] Step 4: Expertos no cargaron.\n' +
      'Causa: storageState inválido o cookie expirada.\n' +
      'Fix: npm run e2e:reset-auth && npm run e2e'
    );
  }

  // Intentar click por nombre exacto primero (E2E Experto 1)
  const byName = page.getByText(/E2E Experto 1/i).first();
  if (await byName.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await byName.click();
  } else {
    // Fallback: primer item de la lista de expertos (cualquier experto sirve)
    await page.locator('ul li, [role="listitem"]')
      .filter({ hasNot: page.locator('nav, header, footer') })
      .first()
      .click({ timeout: 5_000 });
  }

  // Esperar que el contador actualice
  await page.waitForSelector('text=/seleccionados:\\s*[1-9]/i', { timeout: 4_000 });

  // Esperar habilitación del botón Finalizar
  await page.getByRole('button', { name: /finalizar/i })
    .waitFor({ state: 'enabled', timeout: 5_000 });

  await page.getByRole('button', { name: /finalizar/i }).click();
  await page.waitForLoadState('networkidle');

  return name;
}
