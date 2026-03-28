import { Page, Locator } from '@playwright/test';

/**
 * POM for the Admin Users Page.
 * Navigation requires being an Admin.
 */
export class AdminUsersPage {
  readonly page: Page;
  readonly usersTab: Locator;
  readonly newUserButton: Locator;
  readonly roleFilter: Locator;
  readonly showInactiveToggle: Locator;
  readonly usersTable: Locator;
  readonly modalNameInput: Locator;
  readonly modalEmailInput: Locator;
  readonly modalPasswordInput: Locator;
  readonly modalRoleSelect: Locator;
  readonly modalSubmitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usersTab = page.getByRole('tab', { name: /usuarios/i });
    this.newUserButton = page.locator('#btn-nuevo-usuario');
    this.roleFilter = page.getByLabel('Filtrar por rol');
    this.showInactiveToggle = page.getByLabel('Mostrar inactivos');
    this.usersTable = page.getByRole('table');
    
    // Modal Selectors
    this.modalNameInput = page.locator('#user-name');
    this.modalEmailInput = page.locator('#user-email');
    this.modalPasswordInput = page.locator('#user-password');
    this.modalRoleSelect = page.locator('#user-role');
    this.modalSubmitBtn = page.getByRole('button', { name: /crear usuario/i });
  }

  async goto() {
    // Navigation involves clicking "Administración" in the sidebar
    // assuming we're already logged in as Admin.
    const adminLink = this.page.getByRole('button', { name: /administración/i });
    await adminLink.click();
  }

  async findUserRow(email: string): Promise<Locator> {
    return this.page.getByRole('row').filter({ hasText: email });
  }

  async deactivateUser(email: string) {
    const row = await this.findUserRow(email);
    const deactivateBtn = row.getByRole('button', { name: /desactivar/i });
    
    // Intercept window.confirm
    this.page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    await deactivateBtn.click();
    // Wait for the status to change or success message
    await this.page.waitForSelector('.bg-emerald-50'); // Success toast class
  }

  async createUser(data: { name: string, email: string, pass: string, role: string }) {
    await this.newUserButton.click();
    await this.modalNameInput.fill(data.name);
    await this.modalEmailInput.fill(data.email);
    await this.modalPasswordInput.fill(data.pass);
    await this.modalRoleSelect.selectOption(data.role);
    await this.modalSubmitBtn.click();
    
    // Wait for modal to close or success toast
    await this.page.waitForSelector('.bg-emerald-50');
  }
}
