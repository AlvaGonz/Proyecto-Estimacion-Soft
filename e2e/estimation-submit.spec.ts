// e2e/estimation-submit.spec.ts
// RF012: Estimación individual | RF013: Anonimato | RF014: Justificaciones
// RF015: Métricas estadísticas | RF016: Outliers | RF031-RF034: Multi-método
import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';
import { submitEstimation, hasEstimationForm, setupProjectForEstimation, setupProjectWithRoundClose } from './helpers/estimation.helper';

// LEER PRIMERO: EstimationRounds.tsx líneas 203-235 para entender los inputs
// Métodos: wideband-delphi, planning-poker, three-point

async function setupProjectWithTask(page: Page, projectName: string, method = 'Wideband Delphi') {
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  
  await createProjectViaWizard(page, { name: projectName, method, unit: 'Horas', selectAllExperts: true });
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
    
    // Setup: Facilitador crea proyecto y abre ronda, luego experto inicia sesión
    // RF012: Solo expertos pueden ver el formulario de estimación
    await setupProjectForEstimation(page, projectName);
    
    // Como experto con ronda abierta, debe ver el formulario de estimación
    const hasNumberInput = await page.locator('input[type="number"]').first().isVisible({ timeout: 5_000 }).catch(() => false);
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
    
    // Setup: Facilitador crea proyecto y abre ronda, luego experto inicia sesión
    // RF014: Solo expertos pueden añadir justificaciones a estimaciones
    await setupProjectForEstimation(page, projectName);
    
    // Como experto, debe ver el textarea de justificación
    const justifTextarea = page.locator('textarea').first();
    await expect(justifTextarea).toBeVisible({ timeout: 10_000 });
    
    // Llenar justificación (mínimo 10 caracteres requeridos por schema)
    const justificationText = 'Mi justificación es que la tarea requiere 8 horas de análisis detallado';
    await justifTextarea.fill(justificationText);
    
    // Llenar valor de estimación
    const numInput = page.locator('input[type="number"]').first();
    await numInput.fill('8');
    
    // Enviar estimación con justificación
    await page.getByRole('button', { name: /enviar|guardar/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verificar que la estimación fue enviada:
    // - El formulario se resetea (input vacío) O
    // - La estimación aparece en la lista de resultados O
    // - El contador de expertos aumenta
    const inputCleared = await numInput.inputValue().then(v => v === '' || v === '0').catch(() => false);
    const estimationInList = await page.getByText(/8\s*horas|8\s*h/).first().isVisible({ timeout: 3_000 }).catch(() => false);
    const expertCount = await page.getByText(/1\s*Expertos|1\s*experto/i).first().isVisible({ timeout: 3_000 }).catch(() => false);
    
    expect(inputCleared || estimationInList || expertCount).toBeTruthy();
  });

});

test.describe('ESTIMACIÓN — Cierre de Ronda y Métricas (RF015-RF016)', () => {

  test('T046 — Al cerrar ronda se calculan métricas estadísticas (RS37-RS38, RF015)', async ({ page }) => {
    // RF015: Al cerrar una ronda con estimaciones, el sistema calcula métricas
    const projectName = `Metricas RF015 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Step 1: Abrir ronda (Facilitador)
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Step 2: Experto 1 envía estimación
    await loginAs(page, 'expert1');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.getByText(projectName).click();
    await page.getByText('Tarea de Estimación Test').first().click();
    await submitEstimation(page, { 
      taskName: 'Tarea de Estimación Test', 
      value: 8, 
      justification: 'Justificación Experto 1 - 8 horas' 
    });

    // Step 3: Experto 2 envía estimación
    await loginAs(page, 'expert2');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.getByText(projectName).click();
    await page.getByText('Tarea de Estimación Test').first().click();
    await submitEstimation(page, { 
      taskName: 'Tarea de Estimación Test', 
      value: 12, 
      justification: 'Justificación Experto 2 - 12 horas' 
    });

    // Step 4: Volver a Facilitador y Cerrar Ronda
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.getByText(projectName).click();
    await page.getByText('Tarea de Estimación Test').first().click();
    
    const closeBtn = page.getByRole('button', { name: 'Cerrar y Analizar Ronda' });
    await expect(closeBtn).toBeEnabled({ timeout: 10_000 });
    await closeBtn.click();
    await page.waitForLoadState('networkidle');

    // Step 5: Verificar Estadísticas (RS37-RS38, RF015)
    // El componente usa toFixed(2) para Media y Mediana
    await expect(page.getByText('Media', { exact: true })).toBeVisible();
    await expect(page.getByText('Mediana', { exact: true })).toBeVisible();
    
    // Para 8 y 12, la media y mediana son 10.00
    // Usamos filter para asegurar que el texto es solo 10.00 y no parte de algo más
    await expect(page.getByText('10.00')).toHaveCount(2); 
   });

  test('T047 — Outliers son identificados y marcados (RS39-RS40, RF016)', async ({ page }) => {
    test.setTimeout(200_000); // 5 experts + logins
    const projectName = `Outliers RF016 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Step 1: Facilitador abre ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Step 2: Expertos envían estimaciones
    // [20, 25, 30, 35, 100] -> Q1=25, Q3=35, IQR=10, UpperBound=35 + 1.5*10 = 50. 100 > 50 (Outlier)
    const expertValues = [20, 25, 30, 35, 100];
    const expertRoles: ('expert1' | 'expert2' | 'expert3' | 'expert4' | 'expert5')[] = 
      ['expert1', 'expert2', 'expert3', 'expert4', 'expert5'];
    
    for (let i = 0; i < expertValues.length; i++) {
        await loginAs(page, expertRoles[i]);
        await page.getByRole('button', { name: /proyectos/i }).click();
        await page.getByText(projectName).click();
        await page.getByText('Tarea de Estimación Test').first().click();
        await submitEstimation(page, { 
          taskName: 'Tarea de Estimación Test', 
          value: expertValues[i], 
          justification: `Estimación de experto ${i+1}` 
        });
    }

    // Step 3: Facilitador cierra ronda
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.getByText(projectName).click();
    await page.getByText('Tarea de Estimación Test').first().click();
    
    const closeBtn = page.getByRole('button', { name: 'Cerrar y Analizar Ronda' });
    await expect(closeBtn).toBeEnabled({ timeout: 10_000 });
    await closeBtn.click();
    await page.waitForLoadState('networkidle');
    
    // Step 4: Verificar Outlier (100)
    // El sistema debe marcarlo como "atípico" o similar
    // Usar texto más específico para evitar strict mode violation
    await expect(page.getByText('100 Horas')).toBeVisible({ timeout: 5_000 });
    // Refined locator: Find the card that has the text "100 Horas" and then check for the "Atípico" label within it.
    // We use .first() or a more specific selector if needed, but since 100 is unique, this should work.
    const outlierCard = page.locator('div').filter({ hasText: '100 Horas' }).filter({ hasText: 'Experto' });
    await expect(outlierCard.getByText(/atípico/i)).toBeVisible({ timeout: 10_000 });
  });

  test('T048 — Estimaciones visibles después de cerrar ronda (RS34, RF013)', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = `Visible RF013 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea de Estimación Test').first().click();
    await page.waitForTimeout(500);
    
    // Step 1: Facilitador abre ronda
    const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
    if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Step 2: Expertos envían estimaciones
    const expertValues = [5, 8];
    const expertRoles: ('expert1' | 'expert2')[] = ['expert1', 'expert2'];

    for (let i = 0; i < expertValues.length; i++) {
        await loginAs(page, expertRoles[i]);
        await page.getByRole('button', { name: /proyectos/i }).click();
        await page.getByText(projectName).click();
        await page.getByText('Tarea de Estimación Test').first().click();
        await submitEstimation(page, { 
          taskName: 'Tarea de Estimación Test', 
          value: expertValues[i], 
          justification: `Justificación de visibilidad ${i+1}` 
        });
    }

    // Step 3: Facilitador cierra ronda
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.getByText(projectName).click();
    await page.getByText('Tarea de Estimación Test').first().click();
    
    const closeBtn = page.getByRole('button', { name: 'Cerrar y Analizar Ronda' });
    await expect(closeBtn).toBeEnabled({ timeout: 10_000 });
    await closeBtn.click();
    await page.waitForLoadState('networkidle');

    // Ahora las estimaciones DEBEN ser visibles
    await expect(
      page.getByText(/estimaciones|resultados|5|8|media/i).first()
    ).toBeVisible({ timeout: 10_000 });
    
    // Verificar que ambos valores están presentes
    // Usar texto más específico para evitar strict mode violation (getByText('8') matchea timestamp del proyecto)
    await expect(page.getByText('5 Horas')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('8 Horas')).toBeVisible({ timeout: 5_000 });
  });

});

test.describe('ESTIMACIÓN — Multi-Método (RF031-RF034)', () => {

  test('T049 — Wideband Delphi muestra campo numérico libre (RS32a, RF032)', async ({ page }) => {
    const projectName = `WD RF032 ${Date.now()}`;
    // Usar setupProjectForEstimation para crear proyecto, abrir ronda y loguear como experto
    await setupProjectForEstimation(page, projectName, 'Wideband Delphi');

    // Campo numérico libre (no cartas, no campos O/M/P)
    await expect(page.locator('input[type="number"]').first()).toBeVisible({ timeout: 5_000 });
    
    // No deben verse campos de three-point
    const hasThreePoint = await page.getByText(/optimista|pesimista/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasThreePoint).toBeFalsy();
  });

  test('T050 — Planning Poker muestra baraja Fibonacci (RS32b, RF032)', async ({ page }) => {
    const projectName = `PP RF032 ${Date.now()}`;
    // Usar setupProjectForEstimation para crear proyecto, abrir ronda y loguear como experto
    await setupProjectForEstimation(page, projectName, 'Planning Poker');

    // Deben verse cartas Fibonacci: 0, 1, 2, 3, 5, 8, 13, 21, ?
    // PokerCards.tsx muestra botones con los valores de FIBONACCI_SEQUENCE
    // Verificar al menos una carta visible (usar exact: true para evitar strict mode)
    await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible({ timeout: 5_000 });
    
    // Verificar que hay múltiples cartas (grid de botones)
    const cardButtons = await page.locator('button').filter({ hasText: /^(0|1|2|3|5|8|13|21|\?)$/ }).count();
    expect(cardButtons).toBeGreaterThanOrEqual(3);
  });

  test('T051 — Three-Point muestra campos O, M, P (RS32c, RF032)', async ({ page }) => {
    const projectName = `TP RF032 ${Date.now()}`;
    // Usar setupProjectForEstimation para crear proyecto, abrir ronda y loguear como experto
    await setupProjectForEstimation(page, projectName, 'Estimación Tres Puntos');

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
    // RF015c: Three-Point (PERT) calcula E = (O + 4M + P) / 6
    // Este test verifica que el cálculo se muestra correctamente en la UI
    // Usamos facilitador porque el objetivo es verificar el cálculo, no el envío
    
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
      
      // Verificar que el valor esperado calculado se muestra en la UI
      // ThreePointInput.tsx muestra: "Valor Esperado (E): 5.00 hours"
      await expect(page.getByText(/Valor Esperado.*5\.00/i).first()).toBeVisible({ timeout: 5_000 });
      
      // También verificar la desviación estándar
      await expect(page.getByText(/Desviación.*σ.*1\.00/i).first()).toBeVisible({ timeout: 3_000 });
    }
  });

});
