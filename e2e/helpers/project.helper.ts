import { Page } from '@playwright/test';

export async function createProjectViaWizard(
  page: Page,
  opts: {
    name?: string;
    description?: string;
    method?: string;
    unit?: string;
  } = {}
) {
  const name = opts.name ?? `Proyecto E2E ${Date.now()}`;
  const description = opts.description ?? 'Proyecto creado automáticamente por Playwright E2E';
  const method = opts.method ?? 'Wideband Delphi';
  const unit = opts.unit ?? 'Horas';

  // Abrir wizard de nueva sesión
  await page.getByRole('button', { name: /nueva sesión/i }).first().click();
  await page.waitForSelector('text=/nuevo proyecto|configurar nueva sesión/i', { timeout: 5_000 });

  // Step 1 — Identidad del proyecto
  const nameInput = page.locator('#projectName');
  await nameInput.waitFor({ state: 'visible' });
  await nameInput.fill(name);

  const descInput = page.locator('#projectDesc');
  await descInput.fill(description);

  await page.getByRole('button', { name: /siguiente/i }).first().click();
  await page.waitForTimeout(300); // animación de step

  // Step 2 — Método de estimación
  await page.getByText(new RegExp(method, 'i')).click();
  await page.getByRole('button', { name: /siguiente/i }).first().click();
  await page.waitForTimeout(300);

  // Step 3 — Unidad
  await page.getByText(new RegExp(unit, 'i')).first().click();
  await page.getByRole('button', { name: /siguiente/i }).first().click();
  await page.waitForTimeout(300);

  // Step 4 — Kickoff / Asignar expertos
  // Esperar a que carguen los expertos
  await page.waitForTimeout(500);
  
  // Seleccionar al menos un experto (el primero disponible)
  const expertButtons = page.locator('button[type="button"]').filter({ hasText: /@/ });
  const count = await expertButtons.count();
  if (count > 0) {
    await expertButtons.first().click();
  }
  
  // Finalizar
  await page.getByRole('button', { name: /finalizar/i }).click();
  await page.waitForLoadState('networkidle');

  return name; // retorna el nombre para assertions posteriores
}
