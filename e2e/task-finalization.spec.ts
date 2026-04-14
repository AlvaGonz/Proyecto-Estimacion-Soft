import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

async function openProject(page: Page, projectName: string) {
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  await page.getByText(projectName).first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('FEATURE: Task Finalization & Completion Percentage', () => {

  test('T100 — Task completion percentage updates when expert estimates', async ({ page, browser }) => {
    // 1. Facilitator creates a project with EXACTLY one expert for deterministic percentage
    const projectName = `Progress Test ${Date.now()}`;
    const taskName = 'Task with Progress';
    
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    
    // createProjectViaWizard with selectAllExperts: false selects only 'E2E Experto 1'
    await createProjectViaWizard(page, { 
      name: projectName, 
      selectAllExperts: false 
    });
    
    await openProject(page, projectName);
    
    // Add a task
    await page.getByRole('button', { name: /añadir tarea/i }).click();
    await page.locator('#newTaskTitle').fill(taskName);
    await page.locator('#newTaskDesc').fill('Testing completion percentage');
    await page.getByRole('button', { name: /crear tarea/i }).click();
    
    // Verify initial state (0%)
    await expect(page.getByText('0%')).toBeVisible();

    // Start a round
    // Improved wait for task to be visible
    const taskSelector = page.getByText(taskName).first();
    await taskSelector.waitFor({ state: 'visible' });
    await taskSelector.click();
    await page.getByRole('button', { name: /nueva ronda/i }).click();
    
    // Switch to expert to submit estimation
    const expertContext = await browser.newContext();
    const expertPage = await expertContext.newPage();
    await loginAs(expertPage, 'expert');
    await openProject(expertPage, projectName);
    
    const expertTaskSelector = expertPage.getByText(taskName).first();
    await expertTaskSelector.waitFor({ state: 'visible' });
    await expertTaskSelector.click();
    
    // Fill estimation
    await expertPage.locator('input[type="number"]').fill('8');
    await expertPage.locator('textarea').fill('This is a valid justification for progress test');
    await expertPage.getByRole('button', { name: /enviar estimación/i }).click();
    
    // Wait for submission to complete
    await expect(expertPage.getByRole('button', { name: /enviar estimación/i })).not.toBeEnabled();
    
    // Close expert page
    await expertPage.close();
    await expertContext.close();

    // In facilitator page, completion percentage should have updated to 100%
    // since we only have 1 expert and they submitted.
    await page.reload();
    await page.getByText(taskName).first().waitFor({ state: 'visible' });
    // Should see 100% in the list
    await expect(page.getByText('100%')).toBeVisible({ timeout: 10000 });
  });

  test('T101 — Facilitator can finalize task manually', async ({ page }) => {
    const projectName = `Finalize Test ${Date.now()}`;
    const taskName = 'Task to Finalize';

    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await createProjectViaWizard(page, { name: projectName });
    await openProject(page, projectName);

    // Add task
    await page.getByRole('button', { name: /añadir tarea/i }).click();
    await page.locator('#newTaskTitle').fill(taskName);
    await page.locator('#newTaskDesc').fill('Testing manual finalization');
    await page.getByRole('button', { name: /crear tarea/i }).click();

    // Select task and start round
    const taskSelector = page.getByText(taskName).first();
    await taskSelector.waitFor({ state: 'visible' });
    await taskSelector.click();
    await page.getByRole('button', { name: /nueva ronda/i }).click();
    
    // 2. Close the round to reveal analysis panel
    // Fixed strict mode violation by being more specific or using .first()
    const closeRoundBtn = page.getByRole('button', { name: /cerrar.*ronda/i }).filter({ hasText: /actual|analizar/i }).first();
    await closeRoundBtn.click();

    // Now "Finalizar Tarea" button should be in the analysis panel
    const finalizeBtn = page.getByRole('button', { name: /finalizar tarea/i });
    await expect(finalizeBtn).toBeVisible({ timeout: 10000 });
    await finalizeBtn.click();

    // Task should now show as finalized (indicated by checkmark)
    // The checkmark is CheckCircle2 icon in ProjectDetail
    await expect(page.getByText(taskName).first().locator('..').locator('..').locator('svg')).toBeVisible();
  });



  test('T102 — Facilitator sees progress overview instead of input', async ({ page }) => {
    const projectName = `Facilitator UI ${Date.now()}`;
    const taskName = 'UI Check';

    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await createProjectViaWizard(page, { name: projectName });
    await openProject(page, projectName);

    await page.getByRole('button', { name: /añadir tarea/i }).click();
    await page.locator('#newTaskTitle').fill(taskName);
    await page.locator('#newTaskDesc').fill('Checking UI');
    await page.getByRole('button', { name: /crear tarea/i }).click();

    await page.getByText(taskName).first().click();
    await page.getByRole('button', { name: /nueva ronda/i }).click();

    // Facilitator should see "Progreso de la Ronda"
    await expect(page.getByText(/progreso de la ronda/i)).toBeVisible();
    // Should NOT see input fields
    await expect(page.locator('input[type="number"]')).not.toBeVisible();
    await expect(page.locator('textarea')).not.toBeVisible();
    
    // Should see participation status
    await expect(page.getByText(/estado de participación/i)).toBeVisible();
  });

});
