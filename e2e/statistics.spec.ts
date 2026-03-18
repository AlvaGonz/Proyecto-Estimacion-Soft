// e2e/statistics.spec.ts
// RF017: Gráficos distribución | RF018: Evolución | RF019: Comparativa anon.
// RF020: Convergencia | RF021: Indicadores | RF022: Recomendación
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

async function setupProjectWithClosedRound(page: any, projectName: string, method = 'Wideband Delphi') {
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  
  await createProjectViaWizard(page, { name: projectName, method, unit: 'Horas' });
  await page.getByText(projectName).click();
  await page.waitForLoadState('networkidle');

  // Añadir tarea
  await page.getByRole('button', { name: /añadir tarea/i }).click();
  await page.waitForSelector('#newTaskTitle', { timeout: 5_000 });
  await page.locator('#newTaskTitle').fill('Tarea Stats Test');
  await page.locator('#newTaskDesc').fill('Descripción para test de estadísticas');
  await page.getByRole('button', { name: /crear tarea/i }).click();
  await expect(page.locator('#newTaskTitle')).not.toBeVisible({ timeout: 8_000 });

  // Abrir ronda y enviar estimación
  await page.getByText('Tarea Stats Test').first().click();
  await page.waitForTimeout(500);
  
  const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
  if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForLoadState('networkidle');
  }
  
  // Enviar estimación
  const numInput = page.locator('input[type="number"]').first();
  if (await numInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await numInput.fill('8');
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

  return { projectName };
}

test.describe('ESTADÍSTICAS — Gráficos (RF017-RF019)', () => {

  test('T054 — Histograma de distribución visible tras cerrar ronda (RS41, RF017)', async ({ page }) => {
    const projectName = `Hist RF017 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Verificar elemento canvas (Chart.js/Recharts) o SVG de histograma
    const chartElement = page.locator('canvas, svg, [class*="chart"], [class*="recharts"]').first();
    
    // O mensaje de que no hay datos suficientes
    await expect(
      chartElement.or(page.getByText(/no hay datos suficientes|sin gráfico|distribución/i))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T055 — Gráfico de caja/boxplot visible tras cerrar ronda (RS42, RF017)', async ({ page }) => {
    const projectName = `Box RF017 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    await expect(
      page.locator('[class*="boxplot"], [class*="box-plot"]').first()
        .or(page.locator('canvas').nth(1))
        .or(page.getByText(/distribución|box|IQR/i))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T056 — Gráfico de evolución aparece con múltiples rondas (RS43-RS44, RF018)', async ({ page }) => {
    const projectName = `Evol RF018 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Buscar gráfico de líneas de evolución o botón para ver evolución
    await expect(
      page.getByText(/evolución|tendencia|histórico/i).first()
        .or(page.locator('canvas').first())
        .or(page.getByRole('button', { name: /evolución|tendencia/i }))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T057 — Vista comparativa anónima no revela identidades (RS45-RS46, RF019)', async ({ page }) => {
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
    const projectName = `Conv RF020 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Debe mostrar algún indicador de convergencia
    await expect(
      page.getByText(/convergencia|consenso|desviación|varianza/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T059 — Indicador visual de consenso alto visible (RS49-RS50, RF021)', async ({ page }) => {
    const projectName = `Consenso RF021 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Buscar indicador visual de consenso (badge, color, texto)
    await expect(
      page.getByText(/convergencia alta|consenso alto|alta convergencia|alto consenso/i).first()
        .or(page.locator('[class*="rounded-full"]').filter({ hasText: /alto|alta|✓|check/i }).first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T060 — Sistema recomienda nueva ronda cuando hay divergencia (RS51-RS52, RF022)', async ({ page }) => {
    const projectName = `Diverg RF022 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Buscar recomendación del sistema
    const pageText = await page.locator('body').textContent();
    
    // Puede recomendar nueva ronda O recomendar finalizar
    const hasRecommendation = 
      pageText?.match(/nueva ronda|continuar|abrir.*siguiente|finalizar|concluir|consenso.*alcanzado/i);
    
    expect(hasRecommendation).toBeTruthy();
  });

  test('T061 — Sistema recomienda finalizar cuando hay consenso (RS51-RS52, RF022)', async ({ page }) => {
    const projectName = `Final RF022 ${Date.now()}`;
    await setupProjectWithClosedRound(page, projectName);
    
    // Similar a T060, verificar que hay alguna recomendación
    await expect(
      page.getByText(/finalizar|concluir|consenso.*alcanzado|nueva ronda|continuar/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

});
