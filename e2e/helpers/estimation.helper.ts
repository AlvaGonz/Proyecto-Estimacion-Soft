// e2e/helpers/estimation.helper.ts
// Helpers para registrar estimaciones
// Soporta los tres métodos: Wideband Delphi, Planning Poker, Three-Point

import { Page, expect } from '@playwright/test';
import { loginAs } from './auth.helper';
import { createProjectViaWizard } from './project.helper';

export interface EstimationInput {
  taskName: string;
  value?: number;          // Wideband Delphi - valor numérico libre
  optimistic?: number;     // Three-Point - valor optimista
  mostLikely?: number;     // Three-Point - valor más probable
  pessimistic?: number;    // Three-Point - valor pesimista
  cardValue?: string;      // Planning Poker - carta Fibonacci (e.g., '5', '8', '?', '☕')
  justification?: string;  // RF014 - justificación textual
}

/**
 * Crea una o varias tareas para el proyecto actual.
 */
export async function createTasksForProject(page: Page, taskTitles: string[]): Promise<void> {
  for (const title of taskTitles) {
    await page.getByRole('button', { name: /añadir tarea/i }).click();
    await page.waitForSelector('#newTaskTitle', { timeout: 5_000 });
    await page.locator('#newTaskTitle').fill(title);
    await page.locator('#newTaskDesc').fill(`Descripción para ${title}`);
    await page.getByRole('button', { name: /crear tarea/i }).click();
    await page.waitForSelector('#newTaskTitle', { state: 'hidden', timeout: 8_000 });
  }
}

/**
 * Setup completo para tests de estimación:
 * 1. Crea proyecto como facilitador
 * 2. Añade tarea
 * 3. Abre ronda (esperando a que aparezca el botón)
 * 4. Login como experto para poder estimar
 * 
 * RF012: Solo expertos pueden estimar, no facilitadores.
 */
export async function setupProjectForEstimation(
  page: Page,
  projectName: string,
  method = 'Wideband Delphi',
  selectAllExperts = true // Default to true for multi-expert tests
): Promise<void> {
  // Step 1: Facilitador crea proyecto
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  
  await createProjectViaWizard(page, { name: projectName, method, unit: 'Horas', selectAllExperts });
  await page.getByText(projectName).click();
  await page.waitForLoadState('networkidle');

  // Step 2: Añadir tarea
  await createTasksForProject(page, ['Tarea de Estimación Test']);

  // Step 3: Seleccionar tarea y abrir ronda (como facilitador)
  await page.getByText('Tarea de Estimación Test').first().click();
  await page.waitForTimeout(1500);
  
  // El botón de nueva ronda es un icono "+" sin texto
  const newRoundBtn = page.locator('button').filter({ has: page.locator('svg') })
    .filter({ hasText: /^$/ })
    .filter({ has: page.locator('svg[class*="lucide-plus"], svg[class*="Plus"]') })
    .or(page.locator('button[class*="border-dashed"], button[class*="dashed"]'));
  
  const btn = newRoundBtn.first();
  if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');
  }

  // Step 4: Cambiar a experto (solo expertos pueden estimar)
  await loginAs(page, 'expert');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  
  await page.getByText(projectName).click();
  await page.waitForLoadState('networkidle');
  
  await page.getByText('Tarea de Estimación Test').first().click();
  await page.waitForTimeout(1000);
}

/**
 * Registra una estimación para una tarea.
 */
export async function submitEstimation(page: Page, input: EstimationInput): Promise<void> {
  await page.getByText(input.taskName).first().click();
  await page.waitForTimeout(500);

  const hasPokerCards = await page.getByText('1', { exact: true }).first().isVisible({ timeout: 2_000 }).catch(() => false);
  const hasThreePoint = await page.getByText(/optimista|pesimista/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
  const hasDelphi = await page.locator('input[type="number"]').first().isVisible({ timeout: 2_000 }).catch(() => false);

  if (hasPokerCards && input.cardValue) {
    await page.getByText(input.cardValue, { exact: true }).click();
  } else if (hasThreePoint && input.optimistic !== undefined && input.mostLikely !== undefined && input.pessimistic !== undefined) {
    const inputs = await page.locator('input[type="number"]').all();
    if (inputs.length >= 3) {
      await inputs[0].fill(String(input.optimistic));
      await inputs[1].fill(String(input.mostLikely));
      await inputs[2].fill(String(input.pessimistic));
    }
  } else if (hasDelphi && input.value !== undefined) {
    await page.locator('input[type="number"]').first().fill(String(input.value));
  }

  if (input.justification) {
    const justifTextarea = page.locator('textarea').first();
    if (await justifTextarea.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await justifTextarea.fill(input.justification);
    }
  }

  await page.getByRole('button', { name: /enviar|guardar estimación|submit|estimar/i }).click();
  await page.waitForLoadState('networkidle');
}

/**
 * Verifica si existe un formulario de estimación visible.
 */
export async function hasEstimationForm(page: Page): Promise<boolean> {
  const hasInput = await page.locator('input[type="number"]').first().isVisible({ timeout: 3_000 }).catch(() => false);
  const hasPoker = await page.getByText('5', { exact: true }).first().isVisible({ timeout: 3_000 }).catch(() => false);
  return hasInput || hasPoker;
}

/**
 * Obtiene las métricas mostradas tras cerrar una ronda.
 */
export async function getRoundMetrics(page: Page): Promise<{
  mean?: string;
  median?: string;
  stdDev?: string;
  cv?: string;
}> {
  const metrics: { mean?: string; median?: string; stdDev?: string; cv?: string } = {};
  const pageContent = await page.content();
  
  const meanMatch = pageContent.match(/media[:\s]*([\d.,]+)/i);
  const medianMatch = pageContent.match(/mediana[:\s]*([\d.,]+)/i);
  const stdDevMatch = pageContent.match(/desviaci[oó]n[:\s]*([\d.,]+)/i);
  const cvMatch = pageContent.match(/coeficiente[:\s]*([\d.,]+)/i);
  
  if (meanMatch) metrics.mean = meanMatch[1];
  if (medianMatch) metrics.median = medianMatch[1];
  if (stdDevMatch) metrics.stdDev = stdDevMatch[1];
  if (cvMatch) metrics.cv = cvMatch[1];
  
  return metrics;
}

/**
 * Setup para tests de cierre de ronda con métricas.
 */
export async function setupProjectWithRoundClose(
  page: Page,
  projectName: string,
  method = 'Wideband Delphi'
): Promise<void> {
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  
  await createProjectViaWizard(page, { name: projectName, method, unit: 'Horas', selectAllExperts: true });
  await page.getByText(projectName).click();
  await page.waitForLoadState('networkidle');

  await createTasksForProject(page, ['Tarea de Estimación Test']);

  await page.getByText('Tarea de Estimación Test').first().click();
  await page.waitForTimeout(1500);
  
  const newRoundBtn = page.locator('button').filter({ has: page.locator('svg') })
    .filter({ hasText: /^$/ })
    .or(page.locator('button[class*="border-dashed"], button[class*="dashed"]'));
  
  const btn = newRoundBtn.first();
  if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(2000);
  }

  await loginAs(page, 'expert');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  await page.getByText(projectName).first().click();
  await page.waitForLoadState('networkidle');
  await page.getByText('Tarea de Estimación Test').first().click();

  await page.locator('input[type="number"]').first().fill('8');
  await page.getByRole('button', { name: /enviar|guardar|estimar/i }).click();
  await page.waitForLoadState('networkidle');

  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  await page.getByText(projectName).click();
  await page.waitForLoadState('networkidle');
  await page.getByText('Tarea de Estimación Test').first().click();
}
