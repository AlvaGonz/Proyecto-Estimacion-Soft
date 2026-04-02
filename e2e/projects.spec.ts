import { test, expect } from '@playwright/test';
import { ProjectFormPage } from './pages/ProjectFormPage';
import { TaskManagerPage } from './pages/TaskManagerPage';
import { ExpertAssignmentPage } from './pages/ExpertAssignmentPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { loginAs } from './helpers/auth.helper';

test.describe('Gestión de Proyectos: Creación, Tareas, Expertos, y Documentos', () => {

  test('RF006, RF008, RF009, RF010 - Debe crear un proyecto Delphi completo, asignar tareas y expertos', async ({ page }) => {
    // 1. Login como Facilitador para poder crear proyecto
    await loginAs(page, 'facilitator');

    // 2. Navegar a proyectos
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 1024) {
      await page.getByLabel('Abrir menú').click();
      await page.locator('aside').first().waitFor({ state: 'visible', timeout: 3_000 });
    }
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');

    const projectForm = new ProjectFormPage(page);
    const expertAssign = new ExpertAssignmentPage(page);
    const taskManager = new TaskManagerPage(page);
    const documentsPage = new DocumentsPage(page);

    // Iniciar creación de proyecto (Abre el modal/página wizard)
    await projectForm.openWizard();

    const timestamp = Date.now();
    const projectName = `Proyecto E2E POM - ${timestamp}`;

    // Paso 1: Configurar Proyecto
    await projectForm.fillIdentity(projectName, 'Descripción automatizada generada por E2E.');

    // Paso 2: Seleccionar Método de Estimación
    await projectForm.selectMethod('Wideband Delphi');

    // Paso 3: Configurar Parámetros (Paso nuevo)
    await projectForm.configureParams();

    // Paso 4: Definición de Tareas iniciales (Paso nuevo)
    await projectForm.defineInitialTasks([
      { title: 'Requerimientos Iniciales', desc: 'Levantamiento de información base.' }
    ]);

    // Paso 5: Seleccionar Expertos (Mínimo requerido) - RF009
    await expertAssign.waitForLoad();
    await expertAssign.selectAllExperts();
    
    // Finalizar proceso y retornar a lista
    await projectForm.finishWizard();

    // Validar RF006 - El proyecto está en la lista general de sesiones
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 10_000 });

    // Ingresar al proyecto recién creado
    await page.getByText(projectName).first().click();
    await page.waitForLoadState('networkidle');

    // Validar RF008 - Módulo de definición de tareas
    await taskManager.addTask('Diseñar Modelo UML', 'Hacer diagrama de clases inicial.');
    await taskManager.addTask('Configurar BD', 'Levantar Docker compose c/ MongoDB y datos semilla.');

    // Validar RF010 - Sección de Documentos
    const docsTab = page.getByRole('tab', { name: /documentos|archivos/i });
    if (await docsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await docsTab.click();
      await documentsPage.expectHasDocumentsSection();
    }
  });

});
