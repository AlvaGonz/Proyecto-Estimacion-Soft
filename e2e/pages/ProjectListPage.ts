import { expect, type Locator, type Page } from '@playwright/test';

export class ProjectListPage {
  readonly page: Page;
  readonly addProjectButton: Locator;
  readonly projectCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    // Base on standard dashboard structure
    this.addProjectButton = page.getByRole('button', { name: /nuevo proyecto|crear proyecto/i });
    // In ProjectList.tsx, each project is a button.
    this.projectCards = page.locator('button.group.flex.flex-col.md\\:flex-row');
    this.emptyState = page.getByText(/no hay proyectos/i);
  }

  async goto() {
    // Current route in App.tsx typically /dashboard or /
    await this.page.goto('/dashboard');
  }

  async openCreateWizard() {
    await this.addProjectButton.click();
  }

  async expectProjectVisible(name: string) {
    await expect(this.page.getByRole('heading', { name: name })).toBeVisible();
  }

  async expectProjectStatus(name: string, statusLabel: string) {
    const card = this.page.locator('button.group').filter({ hasText: name });
    await expect(card.getByText(new RegExp(statusLabel, 'i'))).toBeVisible();
  }

  async clickProject(name: string) {
    const card = this.page.locator('button.group').filter({ hasText: name });
    await card.click();
  }
}
