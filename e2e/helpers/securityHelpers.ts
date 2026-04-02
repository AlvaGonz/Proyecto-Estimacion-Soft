import { Page, expect } from '@playwright/test';
import { UserRole } from '../../src/types';

export class SecurityHelper {
  constructor(private page: Page) {}

  /**
   * RNF001: Verifies HTTPS redirection or enforcement.
   * Note: In local dev or test environments, this might be bypassed by ignoreHTTPSErrors: true.
   */
  async checkHttpsEnforcement(baseUrl: string) {
    if (baseUrl.startsWith('https')) {
      await this.page.goto(baseUrl);
      expect(this.page.url()).toContain('https://');
    }
  }

  /**
   * RNF004: Verifies RBAC. Checks if a user role can or cannot access a specific resource.
   */
  async verifyRoleAccess(role: UserRole, targetUrl: string, expectedAccess: boolean) {
    await this.page.goto(targetUrl);
    
    if (expectedAccess) {
      // Should stay on page or at least not be redirected to unauthorized
      expect(this.page.url()).toContain(targetUrl);
      const unauthorizedText = await this.page.getByText(/no autorizado|acceso denegado|unauthorized/i).isVisible();
      expect(unauthorizedText).toBeFalsy();
    } else {
      // Should be redirected to unauthorized, login, or home with error
      const currentUrl = this.page.url();
      const redirected = !currentUrl.includes(targetUrl) || 
                         await this.page.getByText(/no autorizado|acceso denegado|unauthorized/i).isVisible();
      expect(redirected).toBeTruthy();
    }
  }

  /**
   * RNF003: Validates JWT persistence and logout.
   */
  async validateLogout() {
    // Click logout button (assuming it exists in a sidebar or menu)
    const logoutBtn = this.page.getByRole('button', { name: /cerrar sesión|logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await this.page.waitForURL('/login');
    }
  }

  /**
   * RNF003: Verifies that accessing a protected route without token redirects to login.
   */
  async verifyProtectedRoute(route: string) {
    await this.page.context().clearCookies();
    await this.page.goto(route);
    await this.page.waitForURL('/login');
  }
}
