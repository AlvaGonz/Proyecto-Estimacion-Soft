import { Page, Locator, expect } from '@playwright/test';

export class ProjectFormPage {
  readonly page: Page;
  readonly newSessionBtn: Locator;
  readonly projectNameInput: Locator;
  readonly projectDescInput: Locator;
  readonly nextBtn: Locator;
  readonly finishBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newSessionBtn = page.getByRole('button', { name: /nueva sesión/i });
    this.projectNameInput = page.locator('#projectName');
    this.projectDescInput = page.locator('#projectDesc');
    this.nextBtn = page.getByRole('button', { name: /siguiente/i });
    this.finishBtn = page.getByRole('button', { name: /finalizar/i });
  }

  async openWizard() {
    await this.newSessionBtn.waitFor({ state: 'visible', timeout: 5000 });
    await this.newSessionBtn.first().click();
    await this.projectNameInput.waitFor({ state: 'visible', timeout: 8000 });
  }

  async fillIdentity(name: string, description: string) {
    await this.projectNameInput.fill(name);
    await this.projectDescInput.fill(description);
    await this.nextBtn.first().click();
    await this.page.waitForTimeout(600); // Wait for transition
  }

  async selectMethod(method: string) {
    // En ProjectForm.tsx, las opciones del método son botones con el label (Wideband Delphi, etc.)
    const methodBtn = this.page.getByRole('button', { name: new RegExp(method, 'i') });
    await methodBtn.waitFor({ state: 'visible', timeout: 5000 });
    await methodBtn.click();
    await this.nextBtn.first().click();
    await this.page.waitForTimeout(500);
  }

  async configureParams() {
    // Paso 3: Config/Parámetros (asumimos valores por defecto del Wideband Delphi)
    await expect(this.page.getByText(/configuración:/i)).toBeVisible({ timeout: 5000 });
    await this.nextBtn.first().click();
    await this.page.waitForTimeout(400);
  }

  async defineInitialTasks(tasks: { title: string; desc: string }[]) {
    // Paso 4: Tareas
    await expect(this.page.getByText(/tareas a estimar/i)).toBeVisible({ timeout: 5000 });
    
    for (let i = 0; i < tasks.length; i++) {
        const taskInputs = this.page.locator('input[placeholder*="Título"]');
        const taskDescs = this.page.locator('textarea[placeholder*="Descripción"]');
        
        await taskInputs.nth(i).waitFor({ state: 'visible', timeout: 5000 });
        await taskInputs.nth(i).fill(tasks[i].title);
        await taskDescs.nth(i).fill(tasks[i].desc);
      
        if (i < tasks.length - 1) {
            await this.page.getByRole('button', { name: /agregar tarea/i }).click();
            await this.page.waitForTimeout(200);
        }
    }

    await this.nextBtn.first().click();
    await this.page.waitForTimeout(600);
  }

  async finishWizard() {
    // En ProjectForm.tsx, el botón es "Crear Proyecto"
    const createBtn = this.page.getByRole('button', { name: /crear proyecto/i });
    await createBtn.waitFor({ state: 'visible', timeout: 5000 });
    await expect(createBtn).toBeEnabled({ timeout: 5000 });
    await createBtn.click();
    
    // Wait for the wizard to close and back to projects list
    await expect(this.page.getByText('Sesiones')).toBeVisible({ timeout: 15_000 });
  }
}
