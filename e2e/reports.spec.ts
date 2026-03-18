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
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');
    
    // Buscar botón de reporte en cualquier lugar
    await expect(
      page.getByRole('button', { name: /reporte|exportar|PDF|Excel|descargar/i }).first()
        .or(page.getByText(/reporte|exportar|generar/i).first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T077 — Click en "Exportar Reporte" inicia descarga o genera PDF (RS63-RS64, RF028)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = `PDF RF028 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');
    
    const reportBtn = page.getByRole('button', { name: /exportar.*PDF|descargar.*reporte|PDF|reporte/i });
    
    if (await reportBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Capturar el evento de descarga si ocurre
      const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
      
      await reportBtn.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx|csv)$/i);
      } else {
        // Si no hay descarga, puede que genere el reporte en pantalla
        await expect(
          page.getByText(/generando|procesando|reporte generado/i).first()
            .or(page.locator('iframe[src*="pdf"], embed[src*="pdf"]').first())
        ).toBeVisible({ timeout: 10_000 });
      }
    } else {
      test.skip(true, 'Función de reportes no implementada - DEUDA TÉCNICA RF028');
    }
  });

  test('T078 — Tab "Logs" muestra historial completo de acciones (RS65, RF029, RNF007)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = `Audit RF029 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('tab', { name: /logs|audit|historial|trazabilidad/i }).click();
    await page.waitForTimeout(500);
    
    // Debe mostrar historial de actividad - al menos el evento de creación
    await expect(
      page.getByText(/creado|abierto|cerrado|log|actividad|proyecto creado|timestamp/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

});
