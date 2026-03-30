import { test, expect } from '../fixtures/auth.fixture.ts';
import { LoginPage } from '../pages/LoginPage.ts';
import { RegisterPage } from '../pages/RegisterPage.ts';
import { AdminUsersPage } from '../pages/AdminUsersPage.ts';

test.describe('Autenticación y Gestión de Usuarios (RF001)', () => {

  test('Auth-001: Login exitoso como Facilitador', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('aalvarez@uce.edu.do', 'password123');
    
    // Debería ver el dashboard/proyectos
    await expect(page.getByRole('button', { name: /proyectos/i })).toBeVisible({ timeout: 10000 });
  });

  test('Auth-002: Login fallido con credenciales incorrectas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('wrong@uce.edu.do', 'wrongpass');
    
    // Debería mostrar error
    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.emailError).toContainText(/inválida|error/i);
  });

  test('Auth-003: Registro de nuevo experto', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const regBtn = page.getByRole('button', { name: /regístrate/i });
    await regBtn.click();
    
    const regPage = new RegisterPage(page);
    const email = `new.expert.${Date.now()}@uce.edu.do`;
    await regPage.register('Test Expert', email, 'Password123!', 'Password123!');
    
    // Tras el registro exitoso debería entrar al sistema
    await expect(page.getByText(/registro exitoso/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /proyectos/i })).toBeVisible({ timeout: 15000 });
  });

  test('Auth-004: Validaciones de campos en el registro', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
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
    await facilitadorPage.getByRole('button', { name: /cerrar sesión|salir/i }).click();
    
    // Debería volver al login
    await expect(facilitadorPage.locator('#email')).toBeVisible();
  });

  test('Auth-006: Persistencia de sesión tras recarga', async ({ facilitadorPage }) => {
    await facilitadorPage.goto('/');
    await expect(facilitadorPage.getByRole('button', { name: /proyectos/i })).toBeVisible();
    
    await facilitadorPage.reload();
    await expect(facilitadorPage.getByRole('button', { name: /proyectos/i })).toBeVisible();
  });

  test('Auth-007: RBAC - Experto no puede acceder al Panel Admin', async ({ expertPage }) => {
    await expertPage.goto('/');
    // No debería ver el botón de Admin
    await expect(expertPage.getByRole('button', { name: /administración|usuarios/i })).not.toBeVisible();
    
    // Si intenta navegar (si hubiera ruta) recibiría 403 o redirección
  });

  test('Auth-008: Admin crea un nuevo facilitador', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.getByRole('button', { name: /administración/i }).click();
    
    const adminPanel = new AdminUsersPage(adminPage);
    await adminPanel.openCreateModal();
    
    const newEmail = `facilitator.${Date.now()}@uce.edu.do`;
    await adminPanel.createUser('New Facilitator', newEmail, 'Password123!', 'facilitador');
    
    // Verificar que aparezca en la lista
    await expect(adminPage.getByText(newEmail)).toBeVisible();
  });

  test('Auth-009: Navegación entre Login y Registro', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /regístrate/i }).click();
    await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible();
    
    await page.getByRole('button', { name: /inicia sesión/i }).click();
    await expect(page.getByRole('heading', { name: /EstimaPro/i })).toBeVisible();
  });

  test('Auth-010: Protección de rutas no autenticadas', async ({ page, context }) => {
    // Limpiar cookies/storage para asegurar no auth
    await context.clearCookies();
    await page.addInitScript(() => window.localStorage.clear());
    
    await page.goto('/');
    // Debería forzar login
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: /proyectos/i })).not.toBeVisible();
  });

});
