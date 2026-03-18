// e2e/helpers/round.helper.ts
// Helpers para gestión de rondas de estimación
// Leer EstimationRounds.tsx para entender el flujo de rondas

import { Page } from '@playwright/test';

/**
 * Abre una nueva ronda para la tarea actual.
 * Pre-condición: estar en la vista de detalle del proyecto, tab Proceso activo, tarea seleccionada.
 * RF012: ronda abierta habilita estimaciones.
 * 
 * Basado en: EstimationRounds.tsx línea 302-309 (botón con icono Plus para nueva ronda)
 */
export async function openNewRound(page: Page): Promise<void> {
  // El botón aparece cuando no hay ronda activa: es un botón con icono Plus
  // dentro del selector de rondas
  const newRoundBtn = page.locator('button').filter({ has: page.locator('svg') })
    .filter({ hasText: /^$/ }) // Botón sin texto, solo icono
    .or(page.getByRole('button', { name: /nueva ronda|iniciar ronda/i }));
    
  // Buscar el botón con icono + en el área de rondas
  const roundArea = page.locator('[class*="rounded-xl"]').filter({ hasText: /R\d+/ }).first();
  if (await roundArea.isVisible({ timeout: 3_000 }).catch(() => false)) {
    // Ya hay rondas, buscar el botón + al final
    const plusBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    await plusBtn.click();
  } else {
    // Primera ronda - buscar botón iniciar
    await page.getByRole('button', { name: /iniciar ronda|abrir ronda|nueva ronda/i }).first().click();
  }
  
  await page.waitForLoadState('networkidle');
}

/**
 * Cierra la ronda activa.
 * Post-condición: estimaciones se vuelven visibles (RF013).
 * Trigger: cálculo automático de métricas (RF015).
 * 
 * Basado en: EstimationRounds.tsx - el botón de cerrar ronda aparece en la UI
 * cuando hay una ronda abierta y el usuario es facilitador
 */
export async function closeActiveRound(page: Page): Promise<void> {
  // Buscar botón de cerrar ronda - puede estar en diferentes lugares
  const closeBtn = page.getByRole('button', { name: /cerrar ronda|finalizar ronda|close round/i })
    .or(page.locator('button').filter({ has: page.locator('svg') }).filter({ has: page.locator('[class*="close"], [class*="x"], [class*="X"]') }));
    
  if (await closeBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    await closeBtn.first().click();
    
    // Confirmar si hay diálogo de confirmación
    const confirmBtn = page.getByRole('button', { name: /confirmar|sí, cerrar|sí/i });
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Obtiene el número de la ronda activa.
 * Útil para verificar que se creó una nueva ronda.
 */
export async function getActiveRoundNumber(page: Page): Promise<number | null> {
  const activeRound = page.locator('[class*="bg-delphi-keppel"]').filter({ hasText: /R\d+/ });
  if (await activeRound.isVisible({ timeout: 3_000 }).catch(() => false)) {
    const text = await activeRound.textContent();
    const match = text?.match(/R(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  return null;
}

/**
 * Selecciona una ronda específica por su número.
 */
export async function selectRound(page: Page, roundNumber: number): Promise<void> {
  const roundBtn = page.getByText(`R${roundNumber}`, { exact: false });
  if (await roundBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await roundBtn.click();
    await page.waitForTimeout(300);
  }
}
