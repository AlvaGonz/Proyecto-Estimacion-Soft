// e2e/documentation.spec.ts
// RF010: Subir docs | RF011: Experto accede pero no modifica
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

test.describe('DOCUMENTACIÓN — RF010-RF011', () => {

  test('T073 — Tab "Docs" existe en detalle de proyecto (RF010)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    const projectName = `Docs RF010 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('tab', { name: /docs|documentación|archivos/i })).toBeVisible({ timeout: 10_000 });
  });

  test('T074 — Facilitador ve botón de subir documento (RS24, RF010)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = `Upload RF010 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('tab', { name: /docs|documentación/i }).click();
    await page.waitForTimeout(500);
    
    // Facilitador debe ver opción de subir
    await expect(
      page.getByRole('button', { name: /subir|agregar doc|upload|añadir archivo/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T075 — Experto NO ve botón de subir/eliminar docs (RS29, RF011)', async ({ page }) => {
    // Step 1: Facilitador crea proyecto y asigna experto
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = `ExpertDoc RF011 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    
    // Step 2: Experto inicia sesión
    await loginAs(page, 'expert');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Step 3: Experto abre el proyecto
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');
    
    // Step 4: Navegar a pestaña Docs
    await page.getByRole('tab', { name: /docs|documentación/i }).click();
    await page.waitForTimeout(500);
    
    // Step 5: Verificar que el experto NO ve botón de subir
    const uploadBtn = page.getByRole('button', { name: /subir|agregar doc|upload|añadir archivo/i });
    await expect(uploadBtn).not.toBeVisible({ timeout: 5_000 });
    
    // Step 6: Verificar que el experto NO ve botón de eliminar
    // El botón de eliminar usa aria-label con "Eliminar"
    const deleteBtn = page.getByRole('button', { name: /eliminar/i });
    await expect(deleteBtn).not.toBeVisible({ timeout: 5_000 });
    
    // Step 7: Verificar que el experto SÍ puede ver documentos (verificación positiva)
    await expect(page.getByText('Repositorio de Documentación')).toBeVisible();
    
    // Step 8: Verificar que el experto SÍ puede ver botón de descargar
    const downloadBtn = page.getByRole('button', { name: /descargar/i }).first();
    await expect(downloadBtn).toBeVisible();
  });

});
