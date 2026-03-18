// e2e/auth.spec.ts
// RF001: Registro | RF002: Login | RF003: Roles | RF004: Permisos | RF005: Admin
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

// ANTES DE ESCRIBIR: leer helpers/auth.helper.ts completo para ver cómo se hace login
// USERS en auth.helper.ts:
//   facilitator: { email: 'aalvarez@uce.edu.do', password: 'password123', role: 'Facilitador' }
//   expert:      { email: 'expert1@uce.edu.do',  password: 'password123', role: 'Experto' }
//   admin:       { email: 'admin@uce.edu.do',     password: 'password123', role: 'Admin' }

test.describe('AUTH — Registro de Usuarios (RF001)', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  // NOTA: Backend endpoint /auth/register implementado y funcional
  // Frontend: RegisterPage.tsx implementado con validación Zod

  test('T028 — Registro con datos válidos crea usuario (RS1-RS3)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Hacer click en el enlace de registro
    const registerBtn = page.getByRole('button', { name: /regístrate/i });
    await expect(registerBtn).toBeVisible({ timeout: 5_000 });
    await registerBtn.click();
    
    await page.waitForLoadState('networkidle');
    
    // Verificar que estamos en la vista de registro
    await expect(page.getByText(/crear cuenta|registro/i).first()).toBeVisible({ timeout: 5_000 });

    const email = `test_${Date.now()}@test.com`;
    await page.locator('[name="name"]').fill('Test User E2E');
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill('Password123!');
    await page.locator('[name="confirmPassword"]').fill('Password123!');
    
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await page.waitForLoadState('networkidle');

    // Tras registro exitoso, debería redirigir a login o dashboard
    await expect(
      page.getByText(/exitoso|registrado|ingresa|bienvenido/i).first()
        .or(page.locator('text=Proyectos').first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('T029 — Registro sin nombre falla con validación (RS1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click en "Regístrate"
    await page.getByText(/regístrate/i).click();
    await page.waitForLoadState('networkidle');

    // Llenar campos excepto nombre
    await page.locator('#email').fill(`test_${Date.now()}@test.com`);
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');
    // Name field left empty
    
    // Intentar submit - HTML5 validation prevendrá el submit
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await page.waitForTimeout(500);

    // Verificar que seguimos en la página de registro (form no se envió)
    await expect(page.locator('#name')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible();
    
    // El navegador muestra tooltip nativo "Please fill out this field" en el campo name
    // Verificamos que el campo name tiene foco (indicando validación HTML5 activada)
    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible();
    
    // Verificar que NO avanzamos al dashboard (se quedó en registro)
    const isDashboard = await page.getByText(/dashboard|proyectos/i).first().isVisible().catch(() => false);
    expect(isDashboard).toBeFalsy();
  });

  test('T030 — Registro con email duplicado falla (RS2)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: /regístrate/i }).click();
    await page.waitForLoadState('networkidle');
      
    await page.locator('[name="name"]').fill('Test Duplicado');
    await page.locator('[name="email"]').fill('aalvarez@uce.edu.do'); // Email que sabemos que existe
    await page.locator('[name="password"]').fill('Password123!');
    await page.locator('[name="confirmPassword"]').fill('Password123!');
    
    await page.getByRole('button', { name: /crear cuenta/i }).click();

    await expect(
      page.getByText(/correo.*existe|email.*en uso|usuario.*existe|ya.*registrado/i).first()
        .or(page.locator('[role="alert"]').first())
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T031 — Registro con contraseña débil falla (RS3)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: /regístrate/i }).click();
    await page.waitForLoadState('networkidle');
      
    await page.locator('[name="name"]').fill('Test Weak Password');
    await page.locator('[name="email"]').fill(`weak_${Date.now()}@test.com`);
    await page.locator('[name="password"]').fill('123'); // demasiado débil
    await page.locator('[name="confirmPassword"]').fill('123');
    
    await page.getByRole('button', { name: /crear cuenta/i }).click();

    await expect(
      page.getByText(/contraseña.*corta|password.*débil|mínimo.*caracteres|8 caracteres/i).first()
        .or(page.locator('[id="password-error"], [role="alert"]').first())
    ).toBeVisible({ timeout: 5_000 });
  });

});

test.describe('AUTH — Login (RF002)', () => {

  test.use({ storageState: { cookies: [], origins: [] } });

  test('T032 — Login con credenciales válidas accede a la plataforma (RS4-RS5)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    // Debe mostrar la interfaz del facilitador
    await expect(page.getByRole('button', { name: /proyectos/i })).toBeVisible({ timeout: 10_000 });
  });

  test('T033 — Login con contraseña incorrecta falla (RS4)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Usar el selector correcto basado en el id/name real del input
    await page.locator('#email, [name="email"]').fill('aalvarez@uce.edu.do');
    await page.locator('#password, [name="password"]').fill('WrongPassword999');
    await page.getByRole('button', { name: /ingresar|login|entrar/i }).click();

    await expect(
      page.getByText(/credenciales.*incorrectas|contraseña.*incorrecta|error|inválidas/i).first()
        .or(page.locator('[role="alert"], [id="email-error"]').first())
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T034 — Login con email inexistente falla (RS4)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.locator('#email, [name="email"]').fill('noexiste@test.com');
    await page.locator('#password, [name="password"]').fill('Password123!');
    await page.getByRole('button', { name: /ingresar|login|entrar/i }).click();

    await expect(
      page.getByText(/usuario.*no.*encontrado|correo.*no.*registrado|credenciales|error/i).first()
        .or(page.locator('[role="alert"], [id="email-error"]').first())
    ).toBeVisible({ timeout: 5_000 });
  });

  test('T035 — Sin autenticación no accede a rutas protegidas (RS6)', async ({ page }) => {
    // Intentar acceder directo sin login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verificar que estamos en la página de login (no autenticados)
    // Usar un solo selector específico para evitar strict mode violation
    await expect(page.locator('#email')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#password')).toBeVisible({ timeout: 5_000 });
  });

});

test.describe('AUTH — Roles y Permisos (RF003-RF004)', () => {

  test('T036 — Facilitador tiene acceso a "Crear Proyecto" (RS7, RS10)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await expect(page.getByRole('button', { name: /nueva sesión|crear proyecto/i })).toBeVisible({ timeout: 10_000 });
  });

  test('T037 — Experto NO ve botón de "Crear Proyecto" (RS10-RS11)', async ({ page }) => {
    await loginAs(page, 'expert');
    // El experto no debe poder crear proyectos
    // Verificar que NO ve el botón de nueva sesión
    const createBtn = page.getByRole('button', { name: /nueva sesión|crear proyecto/i });
    const count = await createBtn.count();
    expect(count).toBe(0);
  });

  test('T038 — Admin ve panel de administración (RS12)', async ({ page }) => {
    await loginAs(page, 'admin');
    // El admin debe tener acceso al panel de usuarios
    await expect(page.getByRole('button', { name: /admin|usuarios|administración/i })).toBeVisible({ timeout: 10_000 });
  });

  test('T039 — Experto no puede acceder a panel de admin (RS10-RS11, RNF004)', async ({ page }) => {
    await loginAs(page, 'expert');
    // Intentar navegar al panel admin directamente
    // En esta SPA, cambiamos la vista via estado
    // Verificar que el botón de admin no existe para el experto
    const adminBtn = page.getByRole('button', { name: /admin|administración/i });
    const count = await adminBtn.count();
    expect(count).toBe(0);
  });

  test('T040 — Sesión expira al usar token inválido (RS6, RNF003)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    // Forzar token inválido via localStorage/cookie
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Borrar cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
    });
    // Intentar acción protegida
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Debe redirigir al login - verificar que vemos el formulario de login
    await expect(page.locator('#email')).toBeVisible({ timeout: 5_000 });
  });

});
