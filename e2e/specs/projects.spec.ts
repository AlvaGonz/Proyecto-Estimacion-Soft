import { test, expect } from '@playwright/test';
import { ProjectFormPage } from '../pages/ProjectFormPage';
import { ProjectListPage } from '../pages/ProjectListPage';
import { mockExperts, mockProject } from '../fixtures/seed';

test.describe('Projects Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user session
    await page.addInitScript(() => {
      window.localStorage.setItem('estimapro_auth', 'true');
    });

    // Intercept auth/me
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'fac-1',
            name: 'Facilitador Juan',
            email: 'facilitador@test.com',
            role: 'facilitador'
          }
        })
      });
    });

    // Intercept experts list for Step 5
    await page.route('**/api/users*', async (route) => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ success: true, data: mockExperts }) 
      });
    });
    
    // Intercept projects list and creation
    await page.route('**/api/projects*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ 
          status: 200, 
          contentType: 'application/json', 
          body: JSON.stringify({ success: true, data: [mockProject] }) 
        });
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        await route.fulfill({ 
          status: 201, 
          contentType: 'application/json', 
          body: JSON.stringify({ success: true, data: { ...payload, id: 'new-id', createdAt: Date.now(), status: 'preparation' } }) 
        });
      }
    });

    // Intercept task creation (RF008)
    await page.route('**/api/tasks*', async (route) => {
      await route.fulfill({ 
        status: 201, 
        contentType: 'application/json', 
        body: JSON.stringify({ success: true, data: { id: 'task-id' } }) 
      });
    });
    
    // Intercept notifications (redundancy)
    await page.route('**/api/notifications*', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
    });
  });

  test('should display the projects list with mocked data', async ({ page }) => {
    const projectList = new ProjectListPage(page);
    await projectList.goto();
    
    await expect(page.getByText('Sesiones Recientes')).toBeVisible();
    await projectList.expectProjectVisible(mockProject.name);
    await projectList.expectProjectStatus(mockProject.name, 'Preparación');
  });

  test('should create a new project using the 5-step wizard', async ({ page }) => {
    const projectList = new ProjectListPage(page);
    const projectForm = new ProjectFormPage(page);
    
    await projectList.goto();
    await projectList.openCreateWizard();

    // Step 1: General Info
    await projectForm.fillGeneralInfo('Nuevo Proyecto E2E', 'Descripción detallada', 'storyPoints');

    // Step 2: Method
    await projectForm.selectMethod('Wideband Delphi');

    // Step 3: Config
    await projectForm.configureMethod();

    // Step 4: Tasks
    await projectForm.addTasks([
      { title: 'Tarea 1', description: 'Desc 1' },
      { title: 'Tarea 2', description: 'Desc 2' }
    ]);

    // Step 5: Experts
    await projectForm.assignExpertsAndSubmit(['Experto Alpha', 'Experto Beta']);

    // Verification: Should return to dashboard view
    // We expect to see the welcome message or dashboard sections
    await expect(page.getByText(/Visión de Ingeniería|Panel del/i)).toBeVisible();
  });
});
