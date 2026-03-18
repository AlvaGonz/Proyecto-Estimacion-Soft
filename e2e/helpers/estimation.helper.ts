// e2e/helpers/estimation.helper.ts
// Helpers para registrar estimaciones
// Soporta los tres métodos: Wideband Delphi, Planning Poker, Three-Point

import { Page } from '@playwright/test';

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
 * Registra una estimación para una tarea.
 * Soporta los tres métodos: Wideband Delphi, Planning Poker, Three-Point.
 * RF012, RF031-RF032.
 * 
 * Basado en: EstimationRounds.tsx líneas 203-235 (renderEstimationInput)
 * - DelphiInput: input[type="number"] para valor
 * - PokerCards: botones con valores Fibonacci
 * - ThreePointInput: tres campos para O, M, P
 */
export async function submitEstimation(page: Page, input: EstimationInput): Promise<void> {
  // Click en la tarea para seleccionarla
  await page.getByText(input.taskName).first().click();
  await page.waitForTimeout(500);

  // Detectar qué método está activo según los elementos visibles
  const hasPokerCards = await page.getByText('1', { exact: true }).first().isVisible({ timeout: 2_000 }).catch(() => false);
  const hasThreePoint = await page.getByText(/optimista|pesimista/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
  const hasDelphi = await page.locator('input[type="number"]').first().isVisible({ timeout: 2_000 }).catch(() => false);

  if (hasPokerCards && input.cardValue) {
    // Planning Poker - click en la carta
    await page.getByText(input.cardValue, { exact: true }).click();
  } else if (hasThreePoint && input.optimistic !== undefined && input.mostLikely !== undefined && input.pessimistic !== undefined) {
    // Three-Point - llenar tres campos
    const inputs = await page.locator('input[type="number"]').all();
    if (inputs.length >= 3) {
      await inputs[0].fill(String(input.optimistic));
      await inputs[1].fill(String(input.mostLikely));
      await inputs[2].fill(String(input.pessimistic));
    }
  } else if (hasDelphi && input.value !== undefined) {
    // Wideband Delphi - campo numérico libre
    await page.locator('input[type="number"]').first().fill(String(input.value));
  }

  // Justificación (RF014) - si está presente
  if (input.justification) {
    const justifTextarea = page.locator('textarea').filter({ has: page.locator('') })
      .or(page.locator('textarea[placeholder*="justif"], textarea[name*="justif"], textarea[id*="justif"]'))
      .first();
    
    if (await justifTextarea.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await justifTextarea.fill(input.justification);
    }
  }

  // Enviar estimación
  await page.getByRole('button', { name: /enviar|guardar estimación|submit|estimar/i }).click();
  await page.waitForLoadState('networkidle');
}

/**
 * Verifica si existe un formulario de estimación visible.
 * Útil para tests que validan que un experto puede estimar.
 */
export async function hasEstimationForm(page: Page): Promise<boolean> {
  const hasInput = await page.locator('input[type="number"]').first().isVisible({ timeout: 3_000 }).catch(() => false);
  const hasPoker = await page.getByText('5', { exact: true }).first().isVisible({ timeout: 3_000 }).catch(() => false);
  return hasInput || hasPoker;
}

/**
 * Obtiene las métricas mostradas tras cerrar una ronda.
 * RF015: Media, mediana, desviación estándar.
 */
export async function getRoundMetrics(page: Page): Promise<{
  mean?: string;
  median?: string;
  stdDev?: string;
}> {
  const metrics: { mean?: string; median?: string; stdDev?: string } = {};
  
  // Buscar textos que contengan métricas
  const pageContent = await page.content();
  
  const meanMatch = pageContent.match(/media[:\s]*([\d.,]+)/i);
  const medianMatch = pageContent.match(/mediana[:\s]*([\d.,]+)/i);
  const stdDevMatch = pageContent.match(/desviaci[oó]n[:\s]*([\d.,]+)/i);
  
  if (meanMatch) metrics.mean = meanMatch[1];
  if (medianMatch) metrics.median = medianMatch[1];
  if (stdDevMatch) metrics.stdDev = stdDevMatch[1];
  
  return metrics;
}
