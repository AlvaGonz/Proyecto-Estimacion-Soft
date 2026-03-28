import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';

/**
 * auth.spec.ts
 * Covers requirements: RF001-RF005 (Auth & Roles), RNF003-RNF004 (Performance/Security)
 */
test.describe('Authentication and RBAC @auth', () => {
  let loginPage: LoginPage;
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
  });

  // --- REGISTRATION (RF001) ---
  test('auth-001: Success Registration (RF001)', async ({ page }) => {
    const timestamp = Date.now();
    const newUser = {
      name: 'E2E User ' + timestamp,
      email: `e2e.${timestamp}@uce.edu.do`,
      pass: 'Password123!',
      confirmPass: 'Password123!'
    };

    await registerPage.goto();
    await registerPage.register(newUser);

    // Should redirect to dashboard and show welcome
    await expect(page.getByText(/Hola,/i)).toBeVisible();
    await expect(page.getByText(newUser.name.split(' ')[0])).toBeVisible();
  });

  test('auth-002: Registration Validation Errors (RF001)', async ({ page }) => {
    await registerPage.goto();
    await registerPage.submitButton.click(); // Submit empty

    // Check for standard Zod/HTML5 validation indicators (role="alert")
    await expect(registerPage.errorMessage).toHaveCount(0); // Before form validation usually
    // Fill invalid email
    await registerPage.emailInput.fill('invalid-email');
    await registerPage.submitButton.click();
    await expect(page.locator('#email-error')).toBeVisible();
  });

  test('auth-003: Duplicate Email Error (RF002)', async ({ page }) => {
    const duplicateUser = {
      name: 'Duplicate Test',
      email: 'admin@uce.edu.do', // Already exists in TEST_USERS
      pass: 'Password123!',
      confirmPass: 'Password123!'
    };

    await registerPage.goto();
    await registerPage.register(duplicateUser);

    // Backend should return 400/409, frontend shows alert
    await expect(page.getByRole('alert')).toContainText(/correo|uso/i);
  });

  // --- LOGIN (RF003, RF004) ---
  test('auth-004: Role-based Landing and Dashboard (RF004)', async ({ page }) => {
    const adminUser = { email: 'admin@uce.edu.do', pass: 'password123' };
    
    await loginPage.goto();
    await loginPage.login(adminUser.email, adminUser.pass);

    // Verify Admin sees "Administración" link
    await expect(page.getByRole('button', { name: /administración/i })).toBeVisible();
    // Verify Dashboard stats are loaded
    await expect(page.getByText(/Visión de Ingeniería/i)).toBeVisible();
  });

  test('auth-005: Invalid Credentials Check (RF003)', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('wrong@uce.edu.do', 'wrongpass');

    await expect(loginPage.errorMessage).toContainText(/inválidas/i);
  });

  // --- SESSION & JWT (RNF003) ---
  test('auth-006: Session persistence and Token clearance (RNF003)', async ({ page, context }) => {
    // 1. Login
    await loginPage.goto();
    await loginPage.login('admin@uce.edu.do', 'password123');
    await expect(page.getByText(/Hola,/i)).toBeVisible();

    // 2. Clear cookies (simulating token loss)
    await context.clearCookies();
    await page.reload();

    // 3. Should stay at root or redirect to login (SPA state resets to null user)
    await expect(page.getByRole('button', { name: /ingresar al sistema/i })).toBeVisible();
  });

  // --- RBAC ACCESS (RNF007) ---
  test('auth-007: Facilitador RBAC Restriction (RF005)', async ({ facilitadorPage }) => {
    // Facilitador should NOT see "Administración" button in sidebar
    await expect(facilitadorPage.getByRole('button', { name: /administración/i })).not.toBeVisible();
    
    // Attempting to reach Admin Panel if we knew the state (SPA check)
    // In this app, we check if the Admin component is rendered via DOM
    const adminPanel = facilitadorPage.locator('.bg-delphi-giants').filter({ hasText: 'Administración' });
    await expect(adminPanel).not.toBeVisible();
  });

  test('auth-008: Experto RBAC Restriction (RF005)', async ({ expertPage }) => {
    // Experto should NOT see "Administración" AND NOT see "Reportes"
    await expect(expertPage.getByRole('button', { name: /administración/i })).not.toBeVisible();
    await expect(expertPage.getByRole('button', { name: /reportes/i })).not.toBeVisible();
  });

  // --- ADMIN USER MANAGEMENT (RF005) ---
  test('auth-009: Admin Role Assignment (RF005)', async ({ adminPage }) => {
    const adminUsers = new AdminUsersPage(adminPage);
    const timestamp = Date.now();
    const newUser = {
      name: 'Role Test ' + timestamp,
      email: `role.${timestamp}@uce.edu.do`,
      pass: 'Password123!',
      role: 'facilitador'
    };

    await adminUsers.goto();
    await adminUsers.createUser(newUser);

    // Verify in table
    const row = await adminUsers.findUserRow(newUser.email);
    await expect(row).toBeVisible();
    await expect(row.getByText('facilitador', { exact: true })).toBeVisible();
  });

  test('auth-010: User Deactivation and Login Block (RF003, RF005)', async ({ adminPage, page: guestPage }) => {
    const adminUsers = new AdminUsersPage(adminPage);
    const timestamp = Date.now();
    const targetUser = {
      name: 'Deactivate Me ' + timestamp,
      email: `bye.${timestamp}@uce.edu.do`,
      pass: 'NoPass123!',
      role: 'experto'
    };

    // 1. Create user as admin
    await adminUsers.goto();
    await adminUsers.createUser(targetUser);

    // 2. Deactivate user
    await adminUsers.deactivateUser(targetUser.email);

    // 3. Try to login as that user in another page context
    const guestLogin = new LoginPage(guestPage);
    await guestLogin.goto();
    await guestLogin.login(targetUser.email, targetUser.pass);

    // Should fail with deactivation message or standard invalid
    await expect(guestLogin.errorMessage).toContainText(/inválidas|desactivado/i);
  });
});
