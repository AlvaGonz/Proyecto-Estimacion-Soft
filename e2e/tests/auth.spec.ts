import { test, expect } from '../fixtures/auth.fixture.ts';
import { LoginPage } from '../pages/LoginPage.ts';
import { RegisterPage } from '../pages/RegisterPage.ts';
import { AdminUsersPage } from '../pages/AdminUsersPage.ts';

// ── Helpers ─────────────────────────────────────────────────────────────────
/** Ensure a completely unauthenticated browser state. */
async function ensureUnauthenticated(page: import('@playwright/test').Page) {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto('/');
  // Wait for the auth-check spinner to finish and login form to render
  await page.locator('#email').waitFor({ state: 'visible', timeout: 15_000 });
}

/** On mobile viewports (< 1024px), the sidebar is off-screen. Open it first. */
async function openSidebarIfMobile(page: import('@playwright/test').Page) {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 1024) {
    await page.getByLabel('Abrir menú').click();
    // Wait for sidebar slide-in animation
    await page.locator('aside').first().waitFor({ state: 'visible', timeout: 3_000 });
  }
}

// ── Test Suite ──────────────────────────────────────────────────────────────
test.describe('Autenticación y Gestión de Usuarios (RF001)', () => {

  test('Auth-001: Login exitoso como Facilitador', async ({ page }) => {
    await ensureUnauthenticated(page);

    const loginPage = new LoginPage(page);
    await loginPage.login('aalvarez@uce.edu.do', 'password123');
    
    // Debería ver el dashboard/proyectos
    await expect(page.getByRole('button', { name: /proyectos/i })).toBeVisible({ timeout: 15_000 });
  });

  test('Auth-002: Login fallido con credenciales incorrectas', async ({ page }) => {
    await ensureUnauthenticated(page);

    const loginPage = new LoginPage(page);
    await loginPage.login('wrong@uce.edu.do', 'wrongpass');
    
    // Debería mostrar error
    await expect(loginPage.emailError).toBeVisible({ timeout: 10_000 });
    await expect(loginPage.emailError).toContainText(/inválida|error/i);
  });

  test('Auth-003: Registro de nuevo experto', async ({ page }) => {
    await ensureUnauthenticated(page);

    const regBtn = page.getByRole('button', { name: /regístrate/i });
    await regBtn.click();
    
    const regPage = new RegisterPage(page);
    const email = `new.expert.${Date.now()}@uce.edu.do`;
    await regPage.register('Test Expert', email, 'Password123!', 'Password123!');
    
    // Tras el registro exitoso debería entrar al sistema
    await expect(page.getByText(/registro exitoso/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /proyectos/i })).toBeVisible({ timeout: 15_000 });
  });

  test('Auth-004: Validaciones de campos en el registro', async ({ page }) => {
    await ensureUnauthenticated(page);

    await page.getByRole('button', { name: /regístrate/i }).click();

    const regPage = new RegisterPage(page);
    // Intentar registrar con passwords desiguales
    await regPage.register('Short', 'invalid-email', '123', '456');
    
    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#password-error')).toBeVisible();
    await expect(page.locator('#confirmPassword-error')).toBeVisible();
  });

  test('Auth-005: Logout exitoso', async ({ facilitadorPage }) => {
    // Usamos el fixture que ya inicia logueado
    await facilitadorPage.goto('/');
    await expect(facilitadorPage.getByRole('button', { name: /proyectos/i })).toBeVisible({ timeout: 10_000 });

    // On mobile, sidebar is off-screen — open it first
    await openSidebarIfMobile(facilitadorPage);
    await facilitadorPage.getByRole('button', { name: /cerrar sesión|salir/i }).click();
    
    // Debería volver al login
    await expect(facilitadorPage.locator('#email')).toBeVisible({ timeout: 10_000 });
  });

  test('Auth-006: Persistencia de sesión tras recarga', async ({ facilitadorPage }) => {
    await facilitadorPage.goto('/');
    await expect(facilitadorPage.getByRole('button', { name: /proyectos/i })).toBeVisible({ timeout: 10_000 });
    
    await facilitadorPage.reload();
    await expect(facilitadorPage.getByRole('button', { name: /proyectos/i })).toBeVisible({ timeout: 10_000 });
  });

  test('Auth-007: RBAC - Experto no puede acceder al Panel Admin', async ({ expertPage }) => {
    await expertPage.goto('/');
    await expect(expertPage.getByRole('button', { name: /proyectos/i })).toBeVisible({ timeout: 10_000 });

    // No debería ver el botón de Admin
    await expect(expertPage.getByRole('button', { name: /administración|usuarios/i })).not.toBeVisible();
  });

  test('Regression: stale adminBtn after React remount should pass after lazy locator fix', async ({ page }) => {
    // This test should now PASS
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    
    // Simulate resolution pattern that could be stale
    const getAdminBtn = () => page.getByRole('button', { name: /administración/i });
    await getAdminBtn().scrollIntoViewIfNeeded();
    await getAdminBtn().click();
    await expect(page).toHaveURL(/.*admin/);
  });

  test('Auth-008: Admin crea un nuevo facilitador', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('domcontentloaded');
    await adminPage.waitForLoadState('networkidle');

    const adminPanel = new AdminUsersPage(adminPage);
    await adminPanel.navigateToAdminPanel();
    
    const newEmail = `facilitator.${Date.now()}@uce.edu.do`;
    await adminPanel.createUser('New Facilitator', newEmail, 'Password123!', 'facilitador');
    
    // Verificar que aparezca en la lista
    await expect(adminPage.getByText(newEmail)).toBeVisible({ timeout: 10_000 });
  });

  test('Auth-009: Navegación entre Login y Registro', async ({ page }) => {
    await ensureUnauthenticated(page);

    await page.getByRole('button', { name: /regístrate/i }).click();
    await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible();
    
    await page.getByRole('button', { name: /inicia sesión/i }).click();
    await expect(page.getByRole('heading', { name: /EstimaPro/i })).toBeVisible();
  });

  test('Auth-010: Protección de rutas no autenticadas', async ({ page }) => {
    await ensureUnauthenticated(page);

    // Debería forzar login
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: /proyectos/i })).not.toBeVisible();
  });

  test('Auth-011: Admin edita un usuario existente (RF030)', async ({ adminPage }) => {
    // ARRANGE — navigate to admin panel
    await adminPage.goto('/');
    await adminPage.waitForLoadState('domcontentloaded');
    await adminPage.waitForLoadState('networkidle');

    const adminPanel = new AdminUsersPage(adminPage);
    await adminPanel.navigateToAdminPanel();

    // Step 1: Create a user to edit (isolated, timestamped email)
    await adminPanel.openCreateModal();
    const email = `to.edit.${Date.now()}@uce.edu.do`;
    await adminPanel.createUser('Original Name', email, 'Password123!', 'experto');
    // Wait for create modal to close
    await adminPanel.modal.waitFor({ state: 'hidden', timeout: 10000 });

    // Step 2: Verify the user appeared in the list
    await expect(adminPage.getByText(email)).toBeVisible({ timeout: 10000 });

    // Step 3: Open edit modal and verify fields are pre-filled
    await adminPanel.openEditModal(email);
    await expect(adminPanel.editModal.locator('#edit-user-name')).toHaveValue('Original Name');

    // Step 4: Update the name
    await adminPanel.editModal.locator('#edit-user-name').fill('Updated Name');
    await adminPanel.editModal.getByRole('button', { name: /guardar cambios/i }).click();

    // Step 5: Verify modal closed and updated name is visible
    await adminPanel.editModal.waitFor({ state: 'hidden', timeout: 10000 });
    await expect(adminPage.getByText('Updated Name').first()).toBeVisible({ timeout: 10000 });
  });

});
