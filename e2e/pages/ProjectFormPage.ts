import { expect, type Locator, type Page } from '@playwright/test';

export class ProjectFormPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly nextButton: Locator;
  readonly prevButton: Locator;
  readonly submitButton: Locator;
  readonly addTaskButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('#projectName');
    this.descriptionInput = page.locator('#projectDesc');
    // Using regex for Spanish labels
    this.nextButton = page.getByRole('button', { name: /siguiente/i });
    this.prevButton = page.getByRole('button', { name: /anterior|revisar/i });
    this.submitButton = page.getByRole('button', { name: /crear proyecto/i });
    this.addTaskButton = page.getByRole('button', { name: /agregar tarea/i });
  }

  async fillGeneralInfo(name: string, description: string, unit: 'hours' | 'storyPoints' | 'days' = 'hours') {
    await this.nameInput.fill(name);
    await this.descriptionInput.fill(description);
    
    // Select unit if not default
    if (unit !== 'hours') {
      const unitLabel = unit === 'storyPoints' ? 'Puntos' : 'Días';
      await this.page.click(`button:has-text("${unitLabel}")`);
    }
    
    await this.nextButton.click();
  }

  async selectMethod(method: string) {
    // Labels in UI: "Wideband Delphi", "Planning Poker", "Tres Puntos (PERT)"
    await this.page.click(`button:has-text("${method}")`);
    await this.nextButton.click();
  }

  async configureMethod() {
    // Step 3 usually has configuration options. For now we just proceed.
    await expect(this.page.getByText(/Config/i)).toBeVisible();
    await this.nextButton.click();
  }

  async addTasks(tasks: { title: string, description: string }[]) {
    for (let i = 0; i < tasks.length; i++) {
      // Target the Nth input/textarea since previous tasks stay in the DOM
      await this.page.locator('input[placeholder*="Título"]').nth(i).fill(tasks[i].title);
      await this.page.locator('textarea[placeholder*="Descripción"]').nth(i).fill(tasks[i].description);
      
      if (i < tasks.length - 1) {
        await this.addTaskButton.click();
      }
    }
    await this.nextButton.click();
  }

  async assignExpertsAndSubmit(expertNames: string[]) {
    // Wait for experts to load (ensure at least one expert from our list is visible)
    if (expertNames.length > 0) {
      await this.page.waitForSelector(`text=${expertNames[0]}`, { state: 'visible' });
    }
    
    for (const name of expertNames) {
      await this.page.click(`text=${name}`);
    }
    await this.submitButton.click();
  }

  async cancel() {
    await this.page.getByLabel(/cancelar/i).click();
  }
}
