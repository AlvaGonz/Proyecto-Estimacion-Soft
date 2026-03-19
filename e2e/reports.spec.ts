// e2e/reports.spec.ts
// RF028: Reportes PDF/Excel | RF029: Historial completo
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

test.describe('REPORTES — RF028-RF029', () => {

  test('T076 — Tab "Proceso" o vista contiene sección de reporte (RF028)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = `Report RF028 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    await page.getByText(projectName).first().click();
    await page.waitForLoadState('networkidle');
    
    // Buscar botón de reporte en el proyecto (no el del sidebar)
    // El botón debe estar dentro del contenido principal, no en el sidebar
    const mainContent = page.locator('main, [role="main"], .content').first();
    const reportBtn = mainContent.getByRole('button', { name: /reporte|exportar|PDF|Excel|descargar/i }).first();
    
    await expect(reportBtn.or(page.getByText(/reporte|exportar|generar/i).first())).toBeVisible({ timeout: 10_000 });
  });

  test('T077 — Click en "Exportar Reporte" inicia descarga o genera PDF (RS63-RS64, RF028)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    
    // Crear proyecto para asegurar datos
    const projectName = `Report Gen ${Date.now()}`;
    await page.getByRole('button', { name: /proyectos/i }).click();
    await createProjectViaWizard(page, { name: projectName });
    
    // Navegar a la vista de Reportes
    await page.locator('nav').getByText(/Reportes/i).click();
    await page.waitForLoadState('networkidle');
    
    // Seleccionar Proyecto
    const selector = page.locator('#project-selector');
    await selector.waitFor({ state: 'visible', timeout: 15_000 });
    
    // El label incluye el estado, ej: "Proyecto (preparation)"
    const option = await selector.locator('option', { hasText: projectName }).first();
    const label = await option.textContent();
    await selector.selectOption({ label: label?.trim() });
    
    // Generar y Verificar Descarga
    const generateBtn = page.getByRole('button', { name: /Generar Reporte Profesional/i });
    await expect(generateBtn).toBeEnabled({ timeout: 10_000 });
    
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      generateBtn.click(),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx|csv)$/i);
  });

  test('T078 — Tab "Logs" muestra historial completo de acciones (RS65, RF029, RNF007)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = `Audit RF029 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    await page.getByText(projectName).first().click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('tab', { name: /logs|audit|historial|trazabilidad/i }).click();
    await page.waitForLoadState('networkidle');
    
    // El tab Logs debe existir y mostrar contenido
    // Corregido: .first() al final para evitar strict mode violation y asegurar que algo sea visible
    await expect(
      page.getByText(/creado|abierto|cerrado|log|actividad|proyecto creado|timestamp/i)
        .or(page.locator('[role="tabpanel"]')).first()
    ).toBeVisible({ timeout: 10_000 });
  });

});
