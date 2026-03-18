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
    await loginAs(page, 'expert');
    
    // Navegar a proyectos
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    // El experto puede no tener proyectos asignados
    const firstProject = page.locator('[class*="card"], [class*="Card"]').first();
    if (await firstProject.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstProject.click();
      await page.waitForLoadState('networkidle');
      
      await page.getByRole('tab', { name: /docs|documentación/i }).click();
      await page.waitForTimeout(500);
      
      // Experto NO debe ver botón de subir o eliminar
      const uploadBtn = page.getByRole('button', { name: /subir|agregar doc|upload|eliminar doc|delete.*doc/i });
      const count = await uploadBtn.count();
      expect(count).toBe(0);
    } else {
      test.skip(true, 'Experto no tiene proyectos asignados - verificar setup');
    }
  });

});
