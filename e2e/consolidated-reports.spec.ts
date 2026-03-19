// e2e/consolidated-reports.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

test('CONSOLIDATED REPORTS & AUDIT — RF028-RF029', async ({ page }) => {
  await loginAs(page, 'facilitator');
  
  // 1. Crear proyecto
  const projectName = `Consolidated ${Date.now()}`;
  await page.getByRole('button', { name: /proyectos/i }).click();
  await createProjectViaWizard(page, { name: projectName });
  
  // 2. Navegar a Reportes
  await page.locator('nav').getByText(/Reportes/i).click();
  await page.waitForLoadState('networkidle');
  
  // 3. Seleccionar Proyecto
  const selector = page.locator('#project-selector');
  await selector.waitFor({ state: 'visible', timeout: 15_000 });
  await selector.selectOption({ label: `${projectName} (active)` });
  
  // 4. Configurar Reporte
  const pdfBtn = page.getByRole('button', { name: /^PDF$/i }).first();
  await expect(pdfBtn).toBeVisible({ timeout: 10_000 });
  await pdfBtn.click();
  
  // 5. Generar y Verificar Descarga
  const generateBtn = page.getByRole('button', { name: /Generar Reporte Profesional/i });
  await expect(generateBtn).toBeEnabled({ timeout: 10_000 });
  
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    generateBtn.click(),
  ]);
  
  expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx|csv)$/i);
});
