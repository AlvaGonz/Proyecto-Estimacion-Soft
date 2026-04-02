import { test, expect } from '../fixtures/auth.fixture';
import { setupProjectForEstimation, submitEstimation, getRoundMetrics } from '../helpers/estimation.helper';

test.describe('RF012-RF015: Wideband Delphi Estimation Flow', () => {
  
  test('Complete estimation cycle as an expert (Wideband Delphi)', async ({ expertPage, facilitadorPage, baseURL }) => {
    // 1. Setup: Facilitator creates project & task, opens round
    const projectName = `Delphi-${Date.now()}`;
    await setupProjectForEstimation(expertPage, projectName, 'Wideband Delphi');

    // 2. Submit estimation
    await submitEstimation(expertPage, {
      taskName: 'Tarea de Estimación Test',
      value: 8,
      justification: 'Requiere integración con API externa y manejo de errores.'
    });

    // 3. Close round and verify metrics
    await facilitadorPage.bringToFront();
    await facilitadorPage.goto('/'); // Redirect to projects
    await facilitadorPage.getByText(projectName).first().click();
    await facilitadorPage.getByText('Tarea de Estimación Test').first().click();
    await facilitadorPage.getByRole('button', { name: /cerrar ronda|finalizar/i }).click();

    // 4. Verify results
    const metrics = await getRoundMetrics(facilitadorPage);
    expect(metrics.mean).toBe('8');
    expect(metrics.median).toBe('8');
  });
});
