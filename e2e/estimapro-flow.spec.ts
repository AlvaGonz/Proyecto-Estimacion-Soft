// e2e/estimapro-flow.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, USERS } from './helpers/auth.helper';

test.describe('AUTH — Login y Seguridad', () => {

  test('T001 — Login exitoso como Facilitador muestra el dashboard', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await expect(page.getByText(/proyectos activos|métrica general|dashboard/i))
      .toBeVisible({ timeout: 15_000 });
  });

  test('T002 — Login con credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/correo institucional/i).fill('wrong@uce.edu.do');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();
    // Error message debe aparecer — NO redirigir al dashboard
    await expect(page.getByText(/credenciales|inválid|incorrecto|error/i))
      .toBeVisible({ timeout: 8_000 });
  });

  test('T003 — Login con contraseña vacía muestra validación', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/correo institucional/i).fill(USERS.facilitator.email);
    // Dejar contraseña vacía e intentar submit
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();
    // El form no debe navegar — debe mostrar validación
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    // Verificar que NO llegamos al dashboard
    await expect(page.getByText(/proyectos activos/i)).not.toBeVisible();
  });

  test('T004 — El rol del usuario se muestra correctamente en el sidebar', async ({ page }) => {
    await loginAs(page, 'facilitator');
    // El sidebar user card debe mostrar el nombre o rol
    await expect(page.getByText(/facilitador|Facilitador/i).first())
      .toBeVisible({ timeout: 10_000 });
  });

});

test.describe('Navegación — Flujo Principal', () => {

  test('T005 — Navegación a Proyectos desde Dashboard', async ({ page }) => {
    await loginAs(page, 'facilitator');
    
    // Click en la pestaña Proyectos del sidebar
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Verificar que se ve la lista de proyectos
    await expect(page.getByText(/sesiones|lista de proyectos|mis proyectos/i).first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('T006 — Abrir modal de Nueva Sesión desde Dashboard', async ({ page }) => {
    await loginAs(page, 'facilitator');
    
    // Click en Nueva Sesión (en el dashboard)
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    
    // Verificar que el formulario de creación se abre
    await expect(page.locator('#projectName')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/nombre del proyecto/i)).toBeVisible();
  });

  test('T007 — Abrir modal de Nueva Sesión desde página Proyectos', async ({ page }) => {
    await loginAs(page, 'facilitator');
    
    // Ir a proyectos primero
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Click en Nueva Sesión
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    
    // Verificar que el formulario se abre
    await expect(page.locator('#projectName')).toBeVisible({ timeout: 10_000 });
  });

});
