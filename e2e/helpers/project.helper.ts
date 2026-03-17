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
  await page.waitForSelector('text=/asignar panel|panel de expertos/i', { timeout: 8_000 });

  // Verificar que los expertos cargaron
  const noExperts = page.getByText(/no hay expertos registrados/i);
  const hasNoExperts = await noExperts.isVisible().catch(() => false);
  if (hasNoExperts) {
    throw new Error(
      '[createProjectViaWizard] Step 4: Expertos no cargaron.\n' +
      'Abrir DevTools → Network → verificar GET /api/users retorna 200 con data[].\n' +
      'Si retorna 401: storageState no tiene cookie válida → re-ejecutar global-setup.'
    );
  }

  // Seleccionar "E2E Experto 1" por nombre exacto (creado por global-setup)
  const expertItem = page.getByText(PRIMARY_E2E_EXPERT.displayName).first();
  const expertVisible = await expertItem.isVisible({ timeout: 5_000 }).catch(() => false);

  if (expertVisible) {
    await expertItem.click();
  } else {
    // Fallback: primer elemento clickeable en la lista de expertos
    const expertButtons = page.locator('button[type="button"]').filter({ hasText: /@/ });
    const count = await expertButtons.count();
    if (count > 0) {
      await expertButtons.first().click();
    } else {
      await page.locator('[class*="expert"], [class*="user-item"], ul li').first().click();
    }
  }

  await page.waitForTimeout(300);

  // Confirmar que el contador cambió (Seleccionados: 0 → Seleccionados: 1+)
  await page.waitForSelector('text=/seleccionados:\\s*[1-9]/i', { timeout: 3_000 });

  // Verificar que Finalizar está habilitado
  const finalizar = page.getByRole('button', { name: /finalizar/i });
  await page.waitForFunction(
    () => ![...document.querySelectorAll('button')]
      .find(b => /finalizar/i.test(b.textContent ?? ''))
      ?.hasAttribute('disabled'),
    { timeout: 5_000 }
  );

  await finalizar.click();
  await page.waitForLoadState('networkidle');

  return name;
}
