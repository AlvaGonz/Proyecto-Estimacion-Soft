import { test, expect } from '../fixtures/auth.fixture';
import { createProjectViaWizard } from '../helpers/project.helper';
import { createTasksForProject, submitEstimation, getRoundMetrics } from '../helpers/estimation.helper';

test.describe('RF020-RF022: Multi-Round Convergence Logic', () => {
  
  test('Two rounds: High dispersion -> Discussion -> Consensus', async ({ facilitadorPage, expertPage, expert2Page, baseURL }) => {
    // 1. Setup Project & Task
    await facilitadorPage.goto('/');
    const projectName = `Convergence-${Date.now()}`;
    await createProjectViaWizard(facilitadorPage, { name: projectName, selectAllExperts: true });
    await facilitadorPage.getByText(projectName).first().click();
    await createTasksForProject(facilitadorPage, ['Feature X']);

    // 2. Round 1: High Dispersion (CV > 15)
    await facilitadorPage.getByRole('button', { name: /gestionar rounds/i }).first().click();
    await facilitadorPage.getByRole('button', { name: /abrir ronda 1/i }).click();

    // Expert 1: 5h
    await expertPage.goto('/');
    await expertPage.getByText(projectName).first().click();
    await submitEstimation(expertPage, { taskName: 'Feature X', value: 5, justification: 'Very simple' });

    // Expert 2: 20h
    await expert2Page.goto('/');
    await expert2Page.getByText(projectName).first().click();
    await submitEstimation(expert2Page, { taskName: 'Feature X', value: 20, justification: 'Very complex' });

    // Facilitator: Close Round 1
    await facilitadorPage.bringToFront();
    await facilitadorPage.getByRole('button', { name: /cerrar ronda/i }).click();

    // Verify Low Convergence warning (CV should be high)
    const metrics = await getRoundMetrics(facilitadorPage);
    if (metrics.cv) {
        expect(parseFloat(metrics.cv)).toBeGreaterThan(15);
    }
    await expect(facilitadorPage.getByText(/baja|media/i)).toBeVisible();

    // 3. Round 2: Consensus reached (CV < 15)
    await facilitadorPage.getByRole('button', { name: /abrir ronda 2/i }).click();

    // Expert 1: 12h (convinced)
    await expertPage.bringToFront();
    await submitEstimation(expertPage, { taskName: 'Feature X', value: 12, justification: 'Valid point about complexity' });

    // Expert 2: 13h (convinced)
    await expert2Page.bringToFront();
    await submitEstimation(expert2Page, { taskName: 'Feature X', value: 13, justification: 'Agree with adjustments' });

    // Facilitator: Close Round 2
    await facilitadorPage.bringToFront();
    await facilitadorPage.getByRole('button', { name: /cerrar ronda/i }).click();

    // Verify High Convergence
    const metrics2 = await getRoundMetrics(facilitadorPage);
    if (metrics2.cv) {
        expect(parseFloat(metrics2.cv)).toBeLessThan(15);
    }
    await expect(facilitadorPage.getByText(/alta|consenso/i).first()).toBeVisible();
  });
});
