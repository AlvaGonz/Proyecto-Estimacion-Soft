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

  test('T028 — Registro con datos válidos crea usuario (RS1-RS3)', async ({ page }) => {
    await page.goto('/');
    // INVESTIGAR: ¿hay enlace de registro?
    // Por ahora, la app parece tener login directo - este test documenta la deuda
    // Si hay registro, el enlace típico sería:
    const registerLink = page.getByRole('link', { name: /registrar|crear cuenta|signup/i });
    
    if (await registerLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');

      const email = `test_${Date.now()}@test.com`;
      await page.locator('[name="nombre"], #nombre').fill('Test User E2E');
      await page.locator('[name="correo"], [name="email"], #email').fill(email);
      await page.locator('[name="password"], [name="contrasena"], #password').fill('Password123!');
      await page.getByRole('button', { name: /registrar|crear/i }).click();
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/bienvenido|dashboard|proyectos/i)).toBeVisible({ timeout: 10_000 });
    } else {
      // Documentar deuda técnica: registro no está implementado
      test.skip(true, 'Registro de usuarios no implementado en la UI - DEUDA TÉCNICA RF001');
    }
  });

  test('T029 — Registro sin nombre falla con validación (RS1)', async ({ page }) => {
    await page.goto('/');
    const registerLink = page.getByRole('link', { name: /registrar|crear cuenta|signup/i });
    
    if (await registerLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');

      await page.locator('[name="correo"], [name="email"]').fill(`test_${Date.now()}@test.com`);
      await page.locator('[name="password"]').fill('Password123!');
      await page.getByRole('button', { name: /registrar|crear/i }).click();

      await expect(page.getByText(/nombre.*requerido|campo.*obligatorio|nombre.*vacío/i)).toBeVisible({ timeout: 5_000 });
    } else {
      test.skip(true, 'Registro no implementado - DEUDA TÉCNICA RF001');
    }
  });

  test('T030 — Registro con email duplicado falla (RS2)', async ({ page }) => {
    await page.goto('/');
    const registerLink = page.getByRole('link', { name: /registrar|crear cuenta|signup/i });
    
    if (await registerLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      
      await page.locator('[name="nombre"]').fill('Test Duplicado');
      await page.locator('[name="correo"], [name="email"]').fill('facilitator@test.com');
      await page.locator('[name="password"]').fill('Password123!');
      await page.getByRole('button', { name: /registrar|crear/i }).click();

      await expect(page.getByText(/correo.*existe|email.*registrado|usuario.*existe/i)).toBeVisible({ timeout: 5_000 });
    } else {
      test.skip(true, 'Registro no implementado - DEUDA TÉCNICA RF001');
    }
  });

  test('T031 — Registro con contraseña débil falla (RS3)', async ({ page }) => {
    await page.goto('/');
    const registerLink = page.getByRole('link', { name: /registrar|crear cuenta|signup/i });
    
    if (await registerLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      
      await page.locator('[name="nombre"]').fill('Test Weak Password');
      await page.locator('[name="correo"], [name="email"]').fill(`weak_${Date.now()}@test.com`);
      await page.locator('[name="password"]').fill('123'); // demasiado débil
      await page.getByRole('button', { name: /registrar|crear/i }).click();

      await expect(page.getByText(/contraseña.*corta|password.*débil|mínimo.*caracteres/i)).toBeVisible({ timeout: 5_000 });
    } else {
      test.skip(true, 'Registro no implementado - DEUDA TÉCNICA RF001');
    }
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
    await page.locator('[name="correo"], [name="email"]').fill('aalvarez@uce.edu.do');
    await page.locator('[name="password"]').fill('WrongPassword999');
    await page.getByRole('button', { name: /ingresar|login|entrar/i }).click();

    await expect(page.getByText(/credenciales.*incorrectas|contraseña.*incorrecta|acceso.*denegado|error/i)).toBeVisible({ timeout: 5_000 });
  });

  test('T034 — Login con email inexistente falla (RS4)', async ({ page }) => {
    await page.goto('/');
    await page.locator('[name="correo"], [name="email"]').fill('noexiste@test.com');
    await page.locator('[name="password"]').fill('Password123!');
    await page.getByRole('button', { name: /ingresar|login|entrar/i }).click();

    await expect(page.getByText(/usuario.*no.*encontrado|correo.*no.*registrado|credenciales|error/i)).toBeVisible({ timeout: 5_000 });
  });

  test('T035 — Sin autenticación no accede a rutas protegidas (RS6)', async ({ page }) => {
    // Intentar acceder directo sin login
    await page.goto('/');
    // No hacer login — intentar navegar a una ruta protegida
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Debe mostrar login o redirigir
    await expect(
      page.getByRole('button', { name: /ingresar|login/i })
        .or(page.getByLabel(/correo|email/i))
        .or(page.getByLabel(/contraseña|password/i))
    ).toBeVisible({ timeout: 5_000 });
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
    // Debe redirigir al login
    await expect(
      page.getByRole('button', { name: /ingresar|login/i })
        .or(page.getByLabel(/correo|email/i))
    ).toBeVisible({ timeout: 5_000 });
  });

});
