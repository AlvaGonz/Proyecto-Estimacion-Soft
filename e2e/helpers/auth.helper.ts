import { Page } from '@playwright/test';

export const USERS = {
  facilitator: { email: 'aalvarez@uce.edu.do', password: 'password123', role: 'Facilitador' },
  expert:      { email: 'expert1@uce.edu.do',  password: 'password123', role: 'Experto' },
} as const;

export async function loginAs(page: Page, user: keyof typeof USERS) {
  await page.goto('/');
  const creds = USERS[user];
  
  // Esperar a que el formulario esté listo
  await page.getByLabel(/correo institucional/i).waitFor({ state: 'visible', timeout: 10_000 });
  
  await page.getByLabel(/correo institucional/i).fill(creds.email);
  await page.getByLabel(/contraseña/i).fill(creds.password);
  await page.getByRole('button', { name: /ingresar al sistema/i }).click();
  
  // Esperar navegación o error
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
}

export async function loginAndGoTo(page: Page, user: keyof typeof USERS, section: string) {
  await loginAs(page, user);
  if (section === 'proyectos') {
    await page.getByRole('button', { name: /proyectos/i }).click();
  } else if (section === 'dashboard') {
    await page.getByRole('button', { name: /dashboard/i }).click();
  }
  await page.waitForLoadState('networkidle');
}
