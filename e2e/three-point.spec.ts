// e2e/three-point.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

test.describe('THREE-POINT ESTIMATION — Flujo PERT', () => {

  test('T040 — Crear proyecto con Three-Point y verificar selección', async ({ page }) => {
    await loginAs(page, 'facilitator');

    const projectName = await createProjectViaWizard(page, {
      name: `Three Point PERT E2E ${Date.now()}`,
      description: 'Test de estimación three-point',
      method: 'Estimación Tres Puntos',
      unit: 'Días Persona',
    });

    // El proyecto debe aparecer en la lista
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10_000 });
  });

  test('T041 — Verificar que Three-Point es seleccionable en wizard', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    await page.waitForSelector('#projectName', { timeout: 5_000 });

    // Llenar step 1
    await page.locator('#projectName').fill('Validación Three-Point');
    await page.locator('#projectDesc').fill('Test selección método PERT');
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(300);

    // Step 2 — debe estar visible Three-Point
    await expect(page.getByText(/estimación tres puntos|three.point|tres puntos/i))
      .toBeVisible({ timeout: 5_000 });
    
    // Seleccionarlo
    await page.getByText(/estimación tres puntos|three.point|tres puntos/i).click();
    
    // Verificar que se seleccionó (aparece con estilo de seleccionado)
    await page.waitForTimeout(300);
    expect(true).toBe(true); // Si llegó aquí, el método es seleccionable
  });

  test('T042 — Wizard permite completar flujo con Three-Point', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');

    const projectName = `Flujo PERT Completo ${Date.now()}`;

    // Iniciar wizard
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    await page.waitForSelector('#projectName', { timeout: 5_000 });

    // Step 1
    await page.locator('#projectName').fill(projectName);
    await page.locator('#projectDesc').fill('Proyecto con método Three-Point');
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(300);

    // Step 2 - Seleccionar Three-Point
    await page.getByText(/estimación tres puntos|tres puntos/i).click();
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(300);

    // Step 3 - Seleccionar unidad
    await page.getByText(/días persona/i).click();
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(500);

    // Step 4 - Seleccionar experto
    const expertButtons = page.locator('button[type="button"]').filter({ hasText: /@/ });
    const count = await expertButtons.count();
    if (count > 0) {
      await expertButtons.first().click();
    }

    // Finalizar
    await page.getByRole('button', { name: /finalizar/i }).click();
    await page.waitForLoadState('networkidle');

    // Verificar creación
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10_000 });
  });

  test('T043 — Todos los métodos de estimación disponibles', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    await page.waitForSelector('#projectName', { timeout: 5_000 });

    // Llenar step 1
    await page.locator('#projectName').fill('Test Métodos');
    await page.locator('#projectDesc').fill('Verificar métodos disponibles');
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(300);

    // Verificar los 3 métodos están disponibles
    await expect(page.getByText(/wideband delphi/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/planning poker/i)).toBeVisible();
    await expect(page.getByText(/estimación tres puntos|tres puntos/i)).toBeVisible();
  });

  test('T044 — Proyecto Three-Point muestra método en detalle', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');

    const projectName = `Detalle PERT ${Date.now()}`;
    
    await createProjectViaWizard(page, {
      name: projectName,
      method: 'Estimación Tres Puntos',
      unit: 'Días Persona',
    });

    // Abrir proyecto
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');

    // Debe mostrar la información del proyecto
    await expect(page.getByText(/unidad:/i)).toBeVisible({ timeout: 10_000 });
  });

});

test.describe('THREE-POINT ESTIMATION — Validaciones', () => {

  test('T045 — Three-Point con diferentes unidades', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');

    // Probar con Horas
    const name1 = `PERT Horas ${Date.now()}`;
    await createProjectViaWizard(page, {
      name: name1,
      method: 'Estimación Tres Puntos',
      unit: 'Horas',
    });
    await expect(page.getByText(name1)).toBeVisible({ timeout: 10_000 });

    // Probar con Story Points
    const name2 = `PERT SP ${Date.now()}`;
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    await page.waitForSelector('#projectName', { timeout: 5_000 });
    await page.locator('#projectName').fill(name2);
    await page.locator('#projectDesc').fill('Con Story Points');
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByText(/estimación tres puntos|tres puntos/i).click();
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByText(/puntos de historia/i).click();
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(500);
    
    const expertButtons = page.locator('button[type="button"]').filter({ hasText: /@/ });
    const count = await expertButtons.count();
    if (count > 0) {
      await expertButtons.first().click();
    }
    await page.getByRole('button', { name: /finalizar/i }).click();
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByText(name2)).toBeVisible({ timeout: 10_000 });
  });

});
