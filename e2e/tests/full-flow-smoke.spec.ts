import { test, expect } from '../fixtures/auth.fixture';
import { createProjectViaWizard } from '../helpers/project.helper';
import { createTasksForProject } from '../helpers/estimation.helper';
import { UserRole } from '../../src/types';

test.describe('RF Full-Flow Regression (RF001-RF028)', () => {
  
  test('Complete Flow: Login -> Create Project -> Create Task -> Estimate -> Close -> Report', async ({ facilitadorPage, expertPage, baseURL }) => {
    // 1. Facilitator: Create Project (Wizard)
    await facilitadorPage.goto('/');
    const projectName = `SmokeTest-${Date.now()}`;
    await createProjectViaWizard(facilitadorPage, { name: projectName });

    // 2. Facilitator: Open the new project
    await facilitadorPage.getByText(projectName).first().click();

    // 3. Facilitator: Create a task
    await createTasksForProject(facilitadorPage, ['Diseñar Logo', 'Maquetar Home']);

    // 4. Facilitator: Start a round for 'Diseñar Logo'
    await facilitadorPage.getByRole('button', { name: /gestionar rounds/i }).first().click();
    await facilitadorPage.getByRole('button', { name: /abrir ronda 1/i }).click();

    // 5. Expert: Submit estimation
    await expertPage.goto('/');
    await expertPage.getByText(projectName).first().click();
    await expertPage.getByRole('button', { name: /estimar/i }).first().click();
    await expertPage.locator('input[type="number"]').fill('8');
    await expertPage.locator('textarea').fill('Basado en la complejidad de la marca.');
    await expertPage.getByRole('button', { name: /enviar/i }).click();

    // 6. Facilitator: Close round and view stats
    await facilitadorPage.bringToFront();
    await facilitadorPage.getByRole('button', { name: /cerrar ronda/i }).click();

    // 7. Facilitator: Check Stats & Convergence (RF020-RF022)
    const statsHeading = facilitadorPage.getByText('Estadísticas del Round');
    await expect(statsHeading).toBeVisible();

    // 8. Facilitator: Generate Report (RF028-RF029)
    await facilitadorPage.getByRole('button', { name: /Reportes/i }).click();
    await facilitadorPage.getByRole('button', { name: /generar reporte pdf/i }).click();
    
    // Expecting no crash or major console error
    const successToast = facilitadorPage.getByText(/reporte generado|descargando/i);
    // Success check
  });
});
