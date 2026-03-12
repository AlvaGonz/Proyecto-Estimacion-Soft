import { test, expect } from '@playwright/test';

// Credenciales del seed de desarrollo
const FACILITATOR = { email: 'aalvarez@uce.edu.do', password: 'password123' };

test.describe('Flujo Wideband Delphi — Happy Path', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('T001 — Login como Facilitador', async ({ page }) => {
    await page.getByLabel(/correo institucional/i).fill(FACILITATOR.email);
    await page.getByLabel(/contraseña/i).fill(FACILITATOR.password);
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();
    
    // Esperar a que el dashboard cargue (buscamos un texto único del dashboard)
    await expect(page.getByText(/dashboard|métrica general|proyectos activos/i)).toBeVisible({ timeout: 15_000 });
  });

  test('T002 — Navegación a Proyectos', async ({ page }) => {
    // Login rápido
    await page.getByLabel(/correo institucional/i).fill(FACILITATOR.email);
    await page.getByLabel(/contraseña/i).fill(FACILITATOR.password);
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();

    // Click en la pestaña Proyectos del sidebar
    await page.getByRole('button', { name: /proyectos/i }).click();
    
    // Verificar que la URL cambió o que se ve la lista de proyectos
    await expect(page.getByText(/lista de proyectos|proyectos del sistema/i)).toBeVisible();
  });

  test('T003 — Verificar Modal de Nueva Sesión', async ({ page }) => {
    // Login
    await page.getByLabel(/correo institucional/i).fill(FACILITATOR.email);
    await page.getByLabel(/contraseña/i).fill(FACILITATOR.password);
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();

    // Click en Nueva Sesión
    await page.getByRole('button', { name: /nueva sesión/i }).first().click();
    
    // Verificar que el modal de creación se abre
    await expect(page.getByText(/configurar nueva sesión/i)).toBeVisible();
    await expect(page.getByLabel(/nombre del proyecto/i)).toBeVisible();
  });
});
