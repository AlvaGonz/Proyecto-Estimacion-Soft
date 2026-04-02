import { test, expect } from '../fixtures/auth.fixture';
import { setupProjectForEstimation, submitEstimation, getRoundMetrics } from '../helpers/estimation.helper';

test.describe('RF031-RF032: Planning Poker & Three-Point Methods', () => {
  
  test('Planning Poker: Expert selects Fibonacci card', async ({ expertPage, facilitadorPage }) => {
    const projectName = `Poker-${Date.now()}`;
    await setupProjectForEstimation(expertPage, projectName, 'Planning Poker');

    // Submit Fibonacci value
    await submitEstimation(expertPage, {
      taskName: 'Tarea de Estimación Test',
      cardValue: '8',
      justification: 'Task is moderately complex.'
    });

    // Close and verify
    await facilitadorPage.bringToFront();
    await facilitadorPage.getByRole('button', { name: /cerrar ronda/i }).last().click();
    
    const { mean } = await getRoundMetrics(facilitadorPage);
    expect(mean).toBe('8');
  });

  test('Three-Point: Expert provides O, M, P values', async ({ expertPage, facilitadorPage }) => {
    const projectName = `ThreePoint-${Date.now()}`;
    await setupProjectForEstimation(expertPage, projectName, 'Three-Point Estimation');

    // Submit O=3, M=5, P=10
    await submitEstimation(expertPage, {
      taskName: 'Tarea de Estimación Test',
      optimistic: 3,
      mostLikely: 5,
      pessimistic: 10,
      justification: 'Potential issues in pessimistic case'
    });

    // Close and verify (PERT formula: (O + 4M + P) / 6 = (3 + 20 + 10) / 6 = 5.5)
    await facilitadorPage.bringToFront();
    await facilitadorPage.getByRole('button', { name: /cerrar ronda/i }).last().click();
    
    const { mean } = await getRoundMetrics(facilitadorPage);
    // Depending on the implementation, it might be exactly 5.5 or 5.50
    expect(parseFloat(mean || '0')).toBeCloseTo(5.5, 1);
  });
});
