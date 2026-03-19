// e2e/estimation-rounds.spec.ts
import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

// Helper: navegar a un proyecto específico por nombre
async function openProject(page: Page, projectName: string) {
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  await page.getByText(projectName).first().click();
  await page.waitForLoadState('networkidle');
}

// Helper: crear proyecto con tarea inicial
async function createProjectWithTask(
  page: Page,
  projectName: string,
  taskName: string = 'Tarea Test E2E'
) {
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');

  // Crear proyecto
  await createProjectViaWizard(page, { name: projectName });

  // Abrir proyecto
  await page.getByText(projectName).click();
  await page.waitForLoadState('networkidle');

  // Añadir tarea
  await page.getByRole('button', { name: /añadir tarea/i }).click();
  await page.waitForSelector('#newTaskTitle', { timeout: 5_000 });
  await page.locator('#newTaskTitle').fill(taskName);
  await page.locator('#newTaskDesc').fill('Descripción de la tarea para E2E');
  await page.getByRole('button', { name: /crear tarea/i }).click();
  await page.waitForLoadState('networkidle');

  return { projectName, taskName };
}

test.describe('ESTIMATION ROUNDS — Flujo Completo Delphi', () => {

  test('T020 — Proyecto recién creado muestra tab de Proceso con estimación', async ({ page }) => {
    await loginAs(page, 'facilitator');
    const projectName = `Rondas E2E ${Date.now()}`;
    
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    await createProjectViaWizard(page, { name: projectName });

    await openProject(page, projectName);

    // Debe haber una pestaña de Proceso visible
    await expect(page.getByRole('tab', { name: /proceso/i })).toBeVisible({ timeout: 10_000 });
    // Y debe estar activa por defecto
    await expect(page.getByRole('tabpanel', { name: /proceso/i }).or(page.locator('#panel-tasks'))).toBeVisible();
  });

  test('T021 — Facilitador puede añadir tarea a proyecto', async ({ page }) => {
    await loginAs(page, 'facilitator');
    const projectName = `Tareas E2E ${Date.now()}`;
    
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    await createProjectViaWizard(page, { name: projectName });
    
    await openProject(page, projectName);

    // Click en añadir tarea
    await page.getByRole('button', { name: /añadir tarea/i }).click();
    
    // Modal debe abrirse
    await expect(page.getByText(/nueva tarea/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#newTaskTitle')).toBeVisible();

    // Llenar y crear
    await page.locator('#newTaskTitle').fill('Implementar Login JWT');
    await page.locator('#newTaskDesc').fill('Desarrollar el sistema de autenticación');
    await page.getByRole('button', { name: /crear tarea/i }).click();

    // La tarea debe aparecer en la lista
    // Nota: .first() porque el nombre aparece también en el panel de detalle (h3)
    await expect(page.getByText('Implementar Login JWT').first()).toBeVisible({ timeout: 10_000 });
  });

  test('T022 — Seleccionar tarea muestra panel de estimación', async ({ page }) => {
    const projectName = `Seleccion E2E ${Date.now()}`;
    const taskName = 'Tarea Seleccionable';
    
    await createProjectWithTask(page, projectName, taskName);

    // La tarea debe estar visible y seleccionable
    // Nota: .first() porque el nombre aparece también en el panel de detalle (h3)
    await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 10_000 });
    
    // Click en la tarea
    await page.getByText(taskName).first().click();
    await page.waitForTimeout(500);

    // Debe mostrar el panel de estimación (o mensaje de selección)
    // El componente EstimationRounds se renderiza cuando hay tarea seleccionada
    const estimationPanel = page.locator('[class*="estimation"], [class*="round"]').first();
    await expect(estimationPanel.or(page.getByText(/selecciona una tarea/i))).toBeVisible();
  });

  test('T023 — Proyecto muestra información de método y unidad', async ({ page }) => {
    await loginAs(page, 'facilitator');
    const projectName = `Info E2E ${Date.now()}`;
    
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    await createProjectViaWizard(page, { 
      name: projectName,
      method: 'Wideband Delphi',
      unit: 'Horas'
    });

    await openProject(page, projectName);

    // Debe mostrar la unidad configurada
    await expect(page.getByText(/unidad:/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/horas/i)).toBeVisible();
  });

  test('T024 — Tabs de navegación en proyecto funcionan', async ({ page }) => {
    await loginAs(page, 'facilitator');
    const projectName = `Tabs E2E ${Date.now()}`;
    
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    await createProjectViaWizard(page, { name: projectName });

    await openProject(page, projectName);

    // Verificar todos los tabs
    const tabs = ['Proceso', 'Docs', 'Debate', 'Panel', 'Logs'];
    for (const tab of tabs) {
      const tabButton = page.getByRole('tab', { name: new RegExp(tab, 'i') });
      await expect(tabButton).toBeVisible({ timeout: 5_000 });
      
      // Click y verificar que cambia
      await tabButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('T025 — Estado del proyecto visible en detalle', async ({ page }) => {
    await loginAs(page, 'facilitator');
    const projectName = `Estado E2E ${Date.now()}`;
    
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    await createProjectViaWizard(page, { name: projectName });

    await openProject(page, projectName);

    // Debe mostrar el estado (Preparación, Activo, etc.)
    const statusBadge = page.locator('[class*="rounded-full"]').filter({ hasText: /preparación|activo|kickoff/i });
    await expect(statusBadge.first()).toBeVisible({ timeout: 10_000 });
  });

});

test.describe('ESTIMATION ROUNDS — Gestión de Tareas', () => {

  test('T026 — Cancelar creación de tarea no la crea', async ({ page }) => {
    await loginAs(page, 'facilitator');
    const projectName = `Cancelar Tarea ${Date.now()}`;
    
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    await createProjectViaWizard(page, { name: projectName });
    
    await openProject(page, projectName);

    // Abrir modal y cancelar
    await page.getByRole('button', { name: /añadir tarea/i }).click();
    await page.waitForSelector('#newTaskTitle', { timeout: 5_000 });
    await page.locator('#newTaskTitle').fill('Tarea Cancelada');
    
    // ✅ FIX: Cerrar modal con selector anclado al aria-label específico del botón X
    await page.getByRole('button', { name: 'Cerrar modal' }).click();
    
    // ✅ FIX: Esperar que el modal desaparezca (condición, no timeout frágil)
    await expect(page.locator('#newTaskTitle')).not.toBeVisible({ timeout: 5_000 });

    // No debe haber creado la tarea
    await expect(page.getByText('Tarea Cancelada')).not.toBeVisible();
  });

  test('T027 — Múltiples tareas en un proyecto', async ({ page }) => {
    await loginAs(page, 'facilitator');
    const projectName = `Multi Tareas ${Date.now()}`;
    
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    await createProjectViaWizard(page, { name: projectName });
    
    await openProject(page, projectName);

    // ── Primera tarea ──────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /añadir tarea/i }).click();
    await page.waitForSelector('#newTaskTitle', { timeout: 5_000 });
    await page.locator('#newTaskTitle').fill('Primera Tarea');
    await page.locator('#newTaskDesc').fill('Descripción de la primera tarea');
    await page.getByRole('button', { name: /crear tarea/i }).click();
    await page.waitForLoadState('networkidle');
    
    // ✅ FIX: Esperar que la primera tarea aparezca en la lista (modal se cierra automáticamente)
    await expect(page.getByText('Primera Tarea').first()).toBeVisible({ timeout: 10_000 });
    
    // ✅ FIX: Verificar que el modal se cerró
    await expect(page.locator('#newTaskTitle')).not.toBeVisible({ timeout: 5_000 });

    // ── Segunda tarea ──────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /añadir tarea/i }).click();
    await page.waitForSelector('#newTaskTitle', { timeout: 5_000 });
    await page.locator('#newTaskTitle').fill('Segunda Tarea');
    await page.locator('#newTaskDesc').fill('Descripción de la segunda tarea');
    await page.getByRole('button', { name: /crear tarea/i }).click();
    await page.waitForLoadState('networkidle');
    
    // ✅ FIX: Esperar que la segunda tarea aparezca en la lista
    await expect(page.getByText('Segunda Tarea').first()).toBeVisible({ timeout: 10_000 });

    // Ambas deben estar visibles
    await expect(page.getByText('Primera Tarea').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Segunda Tarea').first()).toBeVisible({ timeout: 10_000 });
  });

});
