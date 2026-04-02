import { Page, Locator, expect } from '@playwright/test';

export class TaskManagerPage {
  readonly page: Page;
  readonly addTaskBtn: Locator;
  readonly taskTitleInput: Locator;
  readonly taskDescInput: Locator;
  readonly saveTaskBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addTaskBtn = page.getByRole('button', { name: /añadir tarea|nueva tarea/i });
    this.taskTitleInput = page.locator('#newTaskTitle');
    this.taskDescInput = page.locator('#newTaskDesc');
    this.saveTaskBtn = page.getByRole('button', { name: /crear tarea|guardar tarea/i });
  }

  async addTask(name: string, description: string) {
    // En ProjectDetail.tsx, el botón es "Añadir Tarea"
    await this.addTaskBtn.first().click();
    await this.taskTitleInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.taskTitleInput.fill(name);
    await this.taskDescInput.fill(description);
    await this.saveTaskBtn.first().click();
    
    // El formulario debe desaparecer (es un modal fixed)
    await this.taskTitleInput.waitFor({ state: 'hidden', timeout: 8000 });
    // La nueva tarea debe aparecer en la pantalla de ProjectDetail
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 5000 });
  }

  async addToWizard(tasks: { title: string; desc: string }[]) {
    // Paso 4 del Wizard (DefineInitialTasks ya lo hace en ProjectFormPage, 
    // pero mantenemos consistencia si se usa desde aquí)
    for (let i = 0; i < tasks.length; i++) {
        const taskContainer = this.page.locator('div.group').nth(i);
        await taskContainer.locator('input[type="text"]').fill(tasks[i].title);
        await taskContainer.locator('textarea').fill(tasks[i].desc);
        if (i < tasks.length - 1) {
            await this.page.getByRole('button', { name: /agregar tarea/i }).click();
        }
    }
  }

  async openTaskDetails(taskName: string) {
    const taskItem = this.page.getByText(taskName).first();
    await taskItem.waitFor({ state: 'visible', timeout: 5000 });
    await taskItem.click();
    await this.page.waitForTimeout(500);
  }
}
