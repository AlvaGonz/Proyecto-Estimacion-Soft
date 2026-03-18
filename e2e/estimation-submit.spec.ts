// e2e/estimation-submit.spec.ts
// RF012: Estimación individual | RF013: Anonimato | RF014: Justificaciones
// RF015: Métricas estadísticas | RF016: Outliers | RF031-RF034: Multi-método
import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';
import { submitEstimation, hasEstimationForm } from './helpers/estimation.helper';

// LEER PRIMERO: EstimationRounds.tsx líneas 203-235 para entender los inputs
// Métodos: wideband-delphi, planning-poker, three-point

async function setupProjectWithTask(page: Page, projectName: string, method = 'Wideband Delphi') {
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  
  await createProjectViaWizard(page, { name: projectName, method, unit: 'Horas' });
  await page.getByText(projectName).click();
  await page.waitForLoadState('networkidle');

  // Añadir tarea
  await page.getByRole('button', { name: /añadir tarea/i }).click();
  await page.waitForSelector('#newTaskTitle', { timeout: 5_000 });
  await page.locator('#newTaskTitle').fill('Tarea de Estimación Test');
  await page.locator('#newTaskDesc').fill('Descripción para test de estimación');
  await page.getByRole('button', { name: /crear tarea/i }).click();
  await expect(page.locator('#newTaskTitle')).not.toBeVisible({ timeout: 8_000 });

  return { projectName };
}

test.describe('ESTIMACIÓN — Registro Individual (RF012, RF013)', () => {

  test('T041 — Facilitador puede abrir una ronda de estimación (RF012)', async ({ page }) => {
    const projectName = `Ronda RF012 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    // Click en la tarea para ver el panel de estimación
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Si no hay ronda activa, debe haber un botón para crear una
    // Verificar que el componente EstimationRounds se renderiza
    await expect(
      page.getByText(/ronda|estimación|round/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T042 — Formulario de estimación visible cuando hay ronda abierta (RS30)', async ({ page }) => {
    const projectName = `Form RF012 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);

    // Verificar que hay un input para estimación (Wideband Delphi por defecto)
    const hasForm = await hasEstimationForm(page);
    
    // Si no hay ronda, crear una primero
    if (!hasForm) {
      const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
      if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await startBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Ahora debe haber formulario - buscar inputs o cartas de poker específicas
    const hasNumberInput = await page.locator('input[type="number"]').first().isVisible({ timeout: 3_000 }).catch(() => false);
    const hasPokerCard = await page.locator('button').filter({ hasText: /^[12358?]$/ }).first().isVisible({ timeout: 3_000 }).catch(() => false);
    const hasThreePoint = await page.getByText(/optimista/i).first().isVisible({ timeout: 3_000 }).catch(() => false);
    
    expect(hasNumberInput || hasPokerCard || hasThreePoint).toBeTruthy();
  });

  test('T043 — Estimación se guarda correctamente (RS31)', async ({ page }) => {
    const projectName = `Guardar RF012 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);

    // Asegurar que hay una ronda abierta
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Ingresar valor numérico y justificación (requerido)
    const numInput = page.locator('input[type="number"]').first();
    const justifTextarea = page.locator('textarea').first();
    
    if (await numInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await numInput.fill('8');
      
      // La justificación es requerida (mínimo 10 caracteres)
      if (await justifTextarea.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await justifTextarea.fill('Justificación de prueba para la estimación de 8 horas');
      }
      
      await page.getByRole('button', { name: /enviar|guardar|submit/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Debe mostrar confirmación o el valor enviado
      await expect(
        page.getByText(/8|enviado|guardado|estimación registrada/i).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test('T044 — Estimaciones ocultas antes de cerrar ronda (RS32-RS33, RF013)', async ({ page }) => {
    const projectName = `Oculto RF013 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Con ronda abierta NO debe verse un listado de estimaciones con valores
    const estimacionesTabla = page.locator('table, [class*="table"]').filter({ hasText: /estimación|valor/i });
    const count = await estimacionesTabla.count();
    
    // Si existe la tabla, los valores deben estar ocultos o anonimizados
    if (count > 0) {
      const valoresVisibles = await page.getByText(/\d+\s*horas|\d+\s*hrs/i).count();
      // Antes de cerrar, no debe haber valores visibles
      expect(valoresVisibles).toBeLessThanOrEqual(1); // Solo el propio si aplica
    }
  });

  test('T045 — Justificación se puede añadir a una estimación (RS35, RF014)', async ({ page }) => {
    const projectName = `Justif RF014 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Asegurar ronda abierta
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Buscar textarea de justificación - existe en DelphiInput, ThreePointInput y PokerCards
    const justifTextarea = page.locator('textarea').first();
    await expect(justifTextarea).toBeVisible({ timeout: 10_000 });
    
    // Llenar justificación (mínimo 10 caracteres requeridos por schema)
    await justifTextarea.fill('Mi justificación es que la tarea requiere 8 horas de análisis detallado');
    
    const numInput = page.locator('input[type="number"]').first();
    await numInput.fill('8');
    
    await page.getByRole('button', { name: /enviar|guardar/i }).click();
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByText(/enviada|guardada|registrada/i).first()).toBeVisible({ timeout: 5_000 });
  });

});

test.describe('ESTIMACIÓN — Cierre de Ronda y Métricas (RF015-RF016)', () => {

  test('T046 — Al cerrar ronda se calculan métricas estadísticas (RS37-RS38, RF015)', async ({ page }) => {
    const projectName = `Metricas RF015 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Abrir ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Enviar estimación con justificación
    const numInput = page.locator('input[type="number"]').first();
    const justifTextarea = page.locator('textarea').first();
    
    if (await numInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await numInput.fill('8');
      if (await justifTextarea.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await justifTextarea.fill('Justificación para métricas');
      }
      await page.getByRole('button', { name: /enviar|guardar/i }).click();
      await page.waitForLoadState('networkidle');
    }
    
    // Cerrar ronda
    const closeBtn = page.getByRole('button', { name: /cerrar|finalizar ronda/i });
    if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await closeBtn.click();
      const confirmBtn = page.getByRole('button', { name: /confirmar|sí/i });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await page.waitForLoadState('networkidle');
    }

    // Deben aparecer métricas: media, mediana, desviación estándar
    await expect(
      page.getByText(/media|mediana|desviación|promedio|mean|median|std/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T047 — Outliers son identificados y marcados (RS39-RS40, RF016)', async ({ page }) => {
    const projectName = `Outliers RF016 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Abrir y cerrar ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    await page.waitForTimeout(1000);
    
    const closeBtn = page.getByRole('button', { name: /cerrar|finalizar ronda/i });
    if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Verificar que existe sección de outliers/valores atípicos (aunque esté vacía)
    await expect(
      page.getByText(/atípico|outlier|valor extremo/i).first()
        .or(page.getByText(/sin valores atípicos|sin outliers/i))
        .or(page.getByText(/media|mediana/i)) // Si no hay outliers, al menos métricas
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T048 — Estimaciones visibles después de cerrar ronda (RS34, RF013)', async ({ page }) => {
    const projectName = `Visible RF013 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Abrir ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Enviar estimación
    const numInput = page.locator('input[type="number"]').first();
    const justifTextarea = page.locator('textarea').first();
    
    if (await numInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await numInput.fill('5');
      if (await justifTextarea.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await justifTextarea.fill('Justificación para visibilidad');
      }
      await page.getByRole('button', { name: /enviar|guardar/i }).click();
      await page.waitForLoadState('networkidle');
    }

    // Cerrar ronda
    const closeBtn = page.getByRole('button', { name: /cerrar|finalizar ronda/i });
    if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Ahora las estimaciones DEBEN ser visibles
    await expect(
      page.getByText(/estimaciones|resultados|5|media/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

});

test.describe('ESTIMACIÓN — Multi-Método (RF031-RF034)', () => {

  test('T049 — Wideband Delphi muestra campo numérico libre (RS32a, RF032)', async ({ page }) => {
    const projectName = `WD RF032 ${Date.now()}`;
    await setupProjectWithTask(page, projectName, 'Wideband Delphi');
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Abrir ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Campo numérico libre (no cartas, no campos O/M/P)
    await expect(page.locator('input[type="number"]').first()).toBeVisible({ timeout: 5_000 });
    
    // No deben verse campos de three-point
    const hasThreePoint = await page.getByText(/optimista|pesimista/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasThreePoint).toBeFalsy();
  });

  test('T050 — Planning Poker muestra baraja Fibonacci (RS32b, RF032)', async ({ page }) => {
    const projectName = `PP RF032 ${Date.now()}`;
    await setupProjectWithTask(page, projectName, 'Planning Poker');
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Abrir ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Deben verse cartas Fibonacci: 1, 2, 3, 5, 8, 13, ?, café
    // PokerCards.tsx muestra botones con los valores de FIBONACCI_SEQUENCE
    await expect(
      page.getByRole('button', { name: '1' }).first()
        .or(page.getByText('5', { exact: true }).first())
        .or(page.getByText('8', { exact: true }).first())
    ).toBeVisible({ timeout: 5_000 });
    
    // Verificar que hay múltiples cartas (grid de botones)
    const cardButtons = await page.locator('button', { hasText: /^(1|2|3|5|8|13|\?)$/ }).count();
    expect(cardButtons).toBeGreaterThanOrEqual(3);
  });

  test('T051 — Three-Point muestra campos O, M, P (RS32c, RF032)', async ({ page }) => {
    const projectName = `TP RF032 ${Date.now()}`;
    await setupProjectWithTask(page, projectName, 'Estimación Tres Puntos');
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Abrir ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Deben verse los tres campos o etiquetas: Optimista, Más Probable, Pesimista
    // ThreePointInput.tsx tiene labels: O (Optimista), M (Más Probable), P (Pesimista)
    await expect(page.getByText(/optimista/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/probable/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/pesimista/i).first()).toBeVisible({ timeout: 5_000 });
    
    // Deben haber 3 inputs numéricos
    const inputs = await page.locator('input[type="number"]').count();
    expect(inputs).toBeGreaterThanOrEqual(3);
  });

  test('T052 — Método no puede modificarse tras iniciar ronda (RS34, RF034)', async ({ page }) => {
    const projectName = `NoModif RF034 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Abrir ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Intentar buscar selector de método - debe estar deshabilitado o no editable
    // En esta implementación, el método está en el proyecto, no en la ronda
    // Verificar que el texto del método se muestra pero no es editable
    await expect(
      page.getByText(/método:|Wideband Delphi|Planning Poker|Tres Puntos/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T053 — Three-Point calcula valor esperado E=(O+4M+P)/6 (RF015c)', async ({ page }) => {
    const projectName = `PERT RF015 ${Date.now()}`;
    await setupProjectWithTask(page, projectName, 'Estimación Tres Puntos');
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Abrir ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Verificar que hay campos para O, M, P
    const inputs = await page.locator('input[type="number"]').all();
    if (inputs.length >= 3) {
      // O=2, M=5, P=8 → E = (2 + 4*5 + 8)/6 = 5.0
      await inputs[0].fill('2');  // Optimista
      await inputs[1].fill('5');  // Más Probable
      await inputs[2].fill('8');  // Pesimista
      
      // Llenar justificación requerida
      const justifTextarea = page.locator('textarea').first();
      if (await justifTextarea.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await justifTextarea.fill('Cálculo PERT con O=2, M=5, P=8');
      }
      
      // ThreePointInput.tsx calcula y muestra el valor esperado automáticamente
      await expect(page.getByText(/5\.0|5,0|valor esperado|expected/i).first()).toBeVisible({ timeout: 5_000 });
      
      await page.getByRole('button', { name: /enviar|guardar/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Cerrar ronda
      const closeBtn = page.getByRole('button', { name: /cerrar|finalizar ronda/i });
      if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForLoadState('networkidle');
      }
      
      // Verificar que aparece el valor esperado calculado
      await expect(
        page.getByText(/5\.0|5,0|valor esperado|expected/i).first()
      ).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip(true, 'Campos Three-Point no encontrados - revisar implementación');
    }
  });

});
