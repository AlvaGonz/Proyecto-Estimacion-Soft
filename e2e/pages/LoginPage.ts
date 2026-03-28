import { Page, Locator } from '@playwright/test';

/**
 * POM for the Login Page.
 * Note: This is an SPA, all pages technically live at '/'.
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    // Using role and name for better resilience
    this.submitButton = page.getByRole('button', { name: /ingresar al sistema/i });
    this.registerLink = page.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/');
    // In our SPA, Login is the default if not authenticated.
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }

  async goToRegister() {
    await this.registerLink.click();
  }
}
