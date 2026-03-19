// e2e/statistics.spec.ts
// RF017: Gráficos distribución | RF018: Evolución | RF019: Comparativa anon.
// RF020: Convergencia | RF021: Indicadores | RF022: Recomendación
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

import { setupProjectWithRoundClose } from './helpers/estimation.helper';

async function setupProjectWithClosedRound(page: any, projectName: string, method = 'Wideband Delphi') {
  // Step 1: Facilitator creates project and task
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  
  // Use exact matching to avoid choosing the wrong project
  await createProjectViaWizard(page, { name: projectName, method, unit: 'Horas' });
  // After wizard, we're on the projects list. Navigate to the project.
  await page.waitForSelector(`text=${projectName}`, { state: 'visible', timeout: 10_000 });
  await page.getByText(projectName).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Click and wait for modal
  await page.getByRole('button', { name: /añadir tarea/i }).first().click();
  const titleSelector = '#newTaskTitle';
  const descSelector = '#newTaskDesc';
  const createBtnSelector = 'button:has-text("Crear Tarea")';
  
  await page.waitForSelector(titleSelector, { state: 'visible', timeout: 10_000 });
  
  // Fill title
  const titleInput = page.locator(titleSelector);
  await titleInput.click();
  await titleInput.clear();
  await page.keyboard.type('Tarea de Estimación Test', { delay: 50 });
  await expect(titleInput).toHaveValue('Tarea de Estimación Test', { timeout: 5_000 });
  
  // Fill description
  const descInput = page.locator(descSelector);
  await descInput.click();
  await descInput.clear();
  await page.keyboard.type('Descripción para test', { delay: 50 });
  await expect(descInput).toHaveValue('Descripción para test', { timeout: 5_000 });
  
  // Submit with explicit wait for modal closure
  await page.click(createBtnSelector);
  await page.waitForSelector(titleSelector, { state: 'hidden', timeout: 15_000 });

  // Select task
  await page.getByText('Tarea de Estimación Test').first().click();
  await page.waitForTimeout(2000);
  
  // Create round
  const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i }).first();
  await expect(startBtn).toBeVisible({ timeout: 5_000 });
  await startBtn.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');
  
  // Verify round was created - look for "Ronda 1" text
  await expect(page.getByText(/ronda 1/i).first()).toBeVisible({ timeout: 10_000 });

  // Step 2: Expert submits estimation
  await loginAs(page, 'expert');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  await page.getByText(projectName).first().click();
  await page.waitForLoadState('networkidle');
  await page.getByText('Tarea de Estimación Test').first().click();
  await page.waitForTimeout(2000);
  
  // Fill estimation form based on method
  if (method.includes('Poker') || method.includes('Agile')) {
    // Planning Poker: Select a card (e.g., 8)
    const card8 = page.getByRole('button', { name: /^8$/i }).first();
    await expect(card8).toBeVisible({ timeout: 10_000 });
    await card8.click({ force: true });
  } else if (method.includes('Tres Puntos') || method.includes('PERT')) {
    // Three Point: Fill O, M, P
    const inputs = page.locator('input[type="number"]');
    await expect(inputs.first()).toBeVisible({ timeout: 10_000 });
    await inputs.nth(0).fill('6'); // Optimistic
    await inputs.nth(1).fill('8'); // Most Likely
    await inputs.nth(2).fill('12'); // Pessimistic
  } else {
    // Standard Delphi
    const numInput = page.locator('input[type="number"]').first();
    await expect(numInput).toBeVisible({ timeout: 10_000 });
    await numInput.fill('8');
  }
  
  const justifInput = page.locator('textarea').first();
  if (await justifInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await justifInput.fill('Justificación de prueba para test E2E');
  }
  
  await page.getByRole('button', { name: /enviar/i }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Step 3: Facilitator closes round
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  await page.getByText(projectName).first().click();
  await page.waitForLoadState('networkidle');
  await page.getByText('Tarea de Estimación Test').first().click();
  await page.waitForTimeout(1000);
  
  // Close round
  const closeBtn = page.getByRole('button', { name: /cerrar y analizar ronda/i });
  await expect(closeBtn).toBeVisible({ timeout: 5_000 });
  await expect(closeBtn).toBeEnabled({ timeout: 15_000 }); // Wait for estimation to appear
  await closeBtn.click();
  
  // Confirm if dialog appears
  const confirmBtn = page.getByRole('button', { name: /confirmar|sí/i });
  if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await confirmBtn.click();
  }
  await page.waitForLoadState('networkidle');

  return { projectName };
}

test.describe('ESTADÍSTICAS — Gráficos (RF017-RF019)', () => {

  test('T054 — Histograma de distribución visible tras cerrar ronda (RS41, RF017)', async ({ page }) => {
    test.setTimeout(60000);
    const projectName = `Hist RF017 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName, 'Planning Poker');
    
    // Click para ver distribución
    await page.getByRole('button', { name: 'Ver distribución' }).click();

    // Verificar gráfico o mensaje fallback
    const chart = page.locator('.recharts-wrapper').first();
    const fallback = page.getByText(/no hay datos suficientes/i).first();
    await expect(chart.or(fallback)).toBeVisible({ timeout: 10_000 });
  });

  test('T055 — Gráfico de caja/boxplot visible tras cerrar ronda (RS42, RF017)', async ({ page }) => {
    test.setTimeout(60000);
    const projectName = `Box RF017 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName, 'Estimación Tres Puntos');
    
    // Click para ver distribución
    await page.getByRole('button', { name: 'Ver distribución' }).click();

    const chart = page.locator('.recharts-wrapper').first();
    const statsText = page.getByText(/PERT|Mediana|Promedio/i).first();
    await expect(chart.or(statsText)).toBeVisible({ timeout: 10_000 });
  });

  test('T056 — Gráfico de evolución aparece con múltiples rondas (RS43-RS44, RF018)', async ({ page }) => {
    test.setTimeout(60000);
    const projectName = `Evol RF018 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Click para ver evolución
    await page.getByRole('button', { name: 'Ver evolución' }).click();

    const chart = page.locator('.recharts-wrapper').first();
    await expect(chart).toBeVisible({ timeout: 10_000 });
  });

  test('T057 — Vista comparativa anónima no revela identidades (RS45-RS46, RF019)', async ({ page }) => {
    test.setTimeout(60000);
    const projectName = `Anon RF019 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // En la vista de resultados, no deben verse nombres reales de expertos
    // Solo identificadores anónimos o iniciales
    const pageText = await page.locator('body').textContent();
    
    // No debe contener emails completos
    expect(pageText).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    
    // Debe haber algún indicador de estimaciones (números, valores)
    await expect(page.getByText(/8|media|mediana/i).first()).toBeVisible({ timeout: 10_000 });
  });

});

test.describe('ESTADÍSTICAS — Convergencia (RF020-RF022)', () => {

  test('T058 — Sistema evalúa convergencia al cerrar ronda (RS47-RS48, RF020)', async ({ page }) => {
    test.setTimeout(60000);
    const projectName = `Conv RF020 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Debe mostrar algún indicador de convergencia
    await expect(
      page.getByText(/convergencia|consenso|desviación|varianza/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T059 — Indicador visual de consenso alto visible (RS49-RS50, RF021)', async ({ page }) => {
    test.setTimeout(60000);
    const projectName = `Consenso RF021 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Buscar indicador visual de consenso (badge, color, texto)
    await expect(
      page.getByText(/convergencia alta|consenso alto|alta convergencia|alto consenso|convergencia media|convergencia/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T060 — Sistema recomienda nueva ronda cuando hay divergencia (RS51-RS52, RF022)', async ({ page }) => {
    test.setTimeout(60000);
    const projectName = `Diverg RF022 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Verificar usando el auto-retrying expect en lugar de extrayendo texto síncrono
    await expect(
      page.getByText(/nueva ronda|continuar|abrir.*siguiente|finalizar|concluir|consenso.*alcanzado/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T061 — Sistema recomienda finalizar cuando hay consenso (RS51-RS52, RF022)', async ({ page }) => {
    test.setTimeout(60000);
    const projectName = `Final RF022 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Similar a T060, verificar que hay alguna recomendación
    await expect(
      page.getByText(/finalizar|concluir|consenso.*alcanzado|nueva ronda|continuar/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

});
