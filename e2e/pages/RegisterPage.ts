import { Page, Locator } from '@playwright/test';

/**
 * POM for the Register Page.
 * Navigation requires being at login first.
 */
export class RegisterPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('#name');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');
    
    this.submitButton = page.getByRole('button', { name: /crear cuenta/i });
    this.loginLink = page.getByRole('button', { name: /¿Ya tienes cuenta\? Inicia sesión/i });
    this.successMessage = page.getByText(/¡Registro exitoso!/i);
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/');
    // Check if we're on login first by looking for the "Register" trigger
    const registerLinkVisible = await this.page.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i }).isVisible();
    if (registerLinkVisible) {
      await this.page.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i }).click();
    }
  }

  async register(data: { name: string, email: string, pass: string, confirmPass: string }) {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.pass);
    await this.confirmPasswordInput.fill(data.confirmPass);
    await this.submitButton.click();
  }

  async goToLogin() {
    await this.loginLink.click();
  }
}
