import { Page, Locator } from '@playwright/test';

export class AdminUsersPage {
  readonly page: Page;
  readonly createUserButton: Locator;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelect: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createUserButton = page.getByRole('button', { name: /crear nuevo usuario/i });
    this.modal = page.getByRole('dialog', { name: /crear nuevo usuario/i });
    this.nameInput = page.locator('#user-name');
    this.emailInput = page.locator('#user-email');
    this.passwordInput = page.locator('#user-password');
    this.roleSelect = page.locator('#user-role');
    this.saveButton = page.getByRole('button', { name: /crear usuario|guardar/i });
  }

  async openCreateModal() {
    await this.createUserButton.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  async createUser(name: string, email: string, pass: string, role: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.roleSelect.selectOption(role);
    await this.saveButton.click();
  }
}
