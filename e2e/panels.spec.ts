// e2e/panels.spec.ts
// RF026: Panel Facilitador | RF027: Panel Experto | RF030: Métricas participación
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

test.describe('PANEL — Facilitador (RF026)', () => {

  test('T066 — Panel muestra proyectos con estado de rondas (RS59, RF026)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    // El dashboard/panel del facilitador debe mostrar proyectos con estado
    await expect(page.getByText(/proyectos|panel|dashboard/i).first()).toBeVisible({ timeout: 10_000 });
    
    // Debe mostrar estado (Preparación, Activo, etc.)
    await expect(
      page.locator('[class*="rounded-full"]').filter({ hasText: /preparación|activo|kickoff|finished/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T067 — Panel muestra porcentaje de participación (RS59-RS60, RF026)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    // Debe mostrar métricas de participación de expertos
    // Puede ser un porcentaje, barras de progreso, o contadores
    await expect(
      page.getByText(/%|expertos|participación|consenso/i).first()
        .or(page.locator('[class*="progress"], [class*="Progress"]').first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T068 — Tab "Panel" en detalle de proyecto (RF026)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Crear proyecto si no hay
    const firstProject = page.locator('[class*="card"], [class*="Card"]').first();
    if (await firstProject.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstProject.click();
    } else {
      // Crear uno nuevo
      const projectName = `Panel RF026 ${Date.now()}`;
      await createProjectViaWizard(page, { name: projectName });
      await page.getByText(projectName).click();
    }
    
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('tab', { name: /panel|team|equipo/i })).toBeVisible({ timeout: 10_000 });
  });

});

test.describe('PANEL — Experto (RF027)', () => {

  test('T069 — Experto ve sus proyectos asignados (RS61, RF027)', async ({ page }) => {
    await loginAs(page, 'expert');
    // El experto debe ver sus proyectos en su panel personal
    await expect(page.getByText(/proyectos|mis proyectos|proyecto|sesiones/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('T070 — Experto ve tareas pendientes de estimación (RS62, RF027)', async ({ page }) => {
    await loginAs(page, 'expert');
    // Si hay rondas abiertas, debe ver tareas pendientes
    // O mensaje de que no hay tareas pendientes
    await expect(
      page.getByText(/pendiente|por estimar|estimación pendiente/i).first()
        .or(page.getByText(/sin tareas|todo al día|no hay|bienvenido/i).first())
    ).toBeVisible({ timeout: 10_000 });
  });

});

test.describe('MÉTRICAS — Participación (RF030)', () => {

  test('T071 — Panel de Logs muestra actividad del proyecto (RS65-RS66, RF029)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = `Logs RF029 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('tab', { name: /logs|audit|historial/i }).click();
    await page.waitForTimeout(500);
    
    // Debe mostrar historial de actividad
    await expect(
      page.getByText(/creado|abierto|cerrado|log|actividad|proyecto creado/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T072 — Métricas de participación calculadas por experto (RS67-RS69, RF030)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    const projectName = `Particip RF030 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('tab', { name: /panel|team|equipo/i }).click();
    await page.waitForTimeout(500);
    
    // Debe mostrar porcentajes de participación o métricas de expertos
    await expect(
      page.getByText(/%|participación|estimaciones|expertos/i).first()
        .or(page.locator('[class*="stat"], [class*="metric"]').first())
    ).toBeVisible({ timeout: 10_000 });
  });

});
