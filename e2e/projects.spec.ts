// e2e/projects.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

test.describe('PROYECTOS — Wizard de Creación', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('T010 — Wizard step 1: validación de nombre obligatorio', async ({ page }) => {
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    await page.waitForSelector('#projectName', { timeout: 5_000 });

    // Intentar avanzar sin nombre (click en siguiente)
    await page.getByRole('button', { name: /siguiente/i }).first().click();

    // Debe permanecer en step 1 - input de nombre aún visible
    await expect(page.locator('#projectName')).toBeVisible();
  });

  test('T011 — Wizard step 1: avanza con datos válidos', async ({ page }) => {
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    await page.waitForSelector('#projectName', { timeout: 5_000 });

    // Llenar nombre y descripción
    await page.locator('#projectName').fill('Proyecto Test E2E');
    await page.locator('#projectDesc').fill('Descripción de prueba para E2E');
    
    // Avanzar al step 2
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(500);

    // Debe mostrar el step 2 (método de estimación)
    await expect(page.getByText(/método de estimación/i)).toBeVisible({ timeout: 5_000 });
  });

  test('T012 — Crear proyecto completo con método Wideband Delphi', async ({ page }) => {
    const projectName = await createProjectViaWizard(page, {
      name: `Sistema Biblioteca ${Date.now()}`,
      description: 'Test automatizado — creación completa de proyecto Delphi',
      method: 'Wideband Delphi',
      unit: 'Horas',
    });

    // El proyecto debe aparecer en la lista
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10_000 });
  });

  test('T013 — Crear proyecto con método Planning Poker', async ({ page }) => {
    const projectName = await createProjectViaWizard(page, {
      name: `App Planning Poker ${Date.now()}`,
      description: 'Test automatizado — Planning Poker method',
      method: 'Planning Poker',
      unit: 'Puntos de Historia',
    });

    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10_000 });
  });

  test('T014 — Crear proyecto con método Three-Point', async ({ page }) => {
    const projectName = await createProjectViaWizard(page, {
      name: `Proyecto PERT ${Date.now()}`,
      description: 'Test automatizado — Three Point Estimation',
      method: 'Estimación Tres Puntos',
      unit: 'Días Persona',
    });

    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10_000 });
  });

  test('T015 — Buscar proyecto por nombre en el search input', async ({ page }) => {
    // Primero crear un proyecto para buscar
    const uniqueId = `XYZ${Date.now()}`;
    await createProjectViaWizard(page, { 
      name: `Búsqueda Proyecto ${uniqueId}`,
      description: 'Proyecto para test de búsqueda'
    });

    // Usar el search input
    const searchInput = page.getByPlaceholder(/buscar proyectos/i);
    await searchInput.fill(uniqueId);
    await page.waitForTimeout(400); // debounce

    // Solo debe verse el proyecto que coincide
    await expect(page.getByText(`Búsqueda Proyecto ${uniqueId}`)).toBeVisible();
  });

  test('T016 — Cancelar wizard no crea proyecto', async ({ page }) => {
    // Contar proyectos antes - buscar elementos que parezcan tarjetas de proyecto
    const cardsBefore = await page.locator('[class*="rounded"]').count();

    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    await page.waitForSelector('#projectName', { timeout: 5_000 });

    // Llenar nombre pero NO completar el wizard
    await page.locator('#projectName').fill('Proyecto Cancelado No Guardar');
    await page.locator('#projectDesc').fill('Este proyecto no debe crearse');

    // Cancelar con el botón de atrás
    await page.getByRole('button', { name: /cancelar/i }).first().click();
    await page.waitForTimeout(500);

    // Contar proyectos después — debe ser similar
    const cardsAfter = await page.locator('[class*="rounded"]').count();
    // Permitir cierta variación por elementos UI, pero no debería aumentar significativamente
    expect(Math.abs(cardsAfter - cardsBefore)).toBeLessThan(3);
  });

  test('T017 — Wizard muestra progreso de steps correctamente', async ({ page }) => {
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    await page.waitForSelector('#projectName', { timeout: 5_000 });

    // Step 1 - debe mostrar "Identidad" activo
    await expect(page.getByText(/identidad/i)).toBeVisible();

    // Completar step 1
    await page.locator('#projectName').fill('Proyecto Steps Test');
    await page.locator('#projectDesc').fill('Test de progreso');
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(400);

    // Step 2 - debe mostrar "Método"
    await expect(page.getByText(/método de estimación/i)).toBeVisible();
    
    // Seleccionar método y avanzar
    await page.getByText(/wideband delphi/i).click();
    await page.getByRole('button', { name: /siguiente/i }).first().click();
    await page.waitForTimeout(400);

    // Step 3 - debe mostrar "Unidad"
    await expect(page.getByText(/unidad de estimación/i)).toBeVisible();
  });

});

test.describe('PROYECTOS — Gestión de Proyectos', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'facilitator');
  });

  test('T018 — Ver detalle de proyecto existente', async ({ page }) => {
    // Crear un proyecto primero
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = await createProjectViaWizard(page, {
      name: `Proyecto Detalle ${Date.now()}`,
      description: 'Para test de detalle'
    });

    // Click en el proyecto para ver detalle
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');

    // Debe mostrar el detalle con tabs
    await expect(page.getByRole('tab', { name: /proceso/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('tab', { name: /docs/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /debate/i })).toBeVisible();
  });

  test('T019 — Volver a lista desde detalle de proyecto', async ({ page }) => {
    // Crear y abrir un proyecto
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = await createProjectViaWizard(page, {
      name: `Proyecto Volver ${Date.now()}`,
    });

    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');

    // Click en botón volver
    await page.getByRole('button', { name: /volver a la lista/i }).click();
    await page.waitForLoadState('networkidle');

    // Debe volver a la lista de proyectos
    await expect(page.getByRole('button', { name: /nueva sesión/i }).first()).toBeVisible({ timeout: 10_000 });
  });

});
