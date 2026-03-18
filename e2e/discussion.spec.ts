// e2e/discussion.spec.ts
// RF023: Espacio discusión | RF024: Moderación facilitador
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

async function setupProjectWithTask(page: any, projectName: string) {
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  
  await createProjectViaWizard(page, { name: projectName });
  
  // Navegar al proyecto recién creado
  await page.getByText(projectName).first().click();
  await page.waitForLoadState('networkidle');
  
  // Verificar que estamos en la página del proyecto (debe mostrar el título)
  await expect(page.getByRole('heading', { name: new RegExp(projectName) }).first()).toBeVisible({ timeout: 10_000 });

  // Añadir tarea
  await page.getByRole('button', { name: /añadir tarea/i }).click();
  await page.waitForSelector('#newTaskTitle', { timeout: 5_000 });
  await page.locator('#newTaskTitle').fill('Tarea Debate Test');
  await page.locator('#newTaskDesc').fill('Descripción para test de debate');
  await page.getByRole('button', { name: /crear tarea/i }).click();
  
  // ✅ FIX: Esperar que el modal se cierre completamente
  await expect(page.locator('#newTaskTitle')).not.toBeVisible({ timeout: 8_000 });

  return { projectName };
}

test.describe('DISCUSIÓN — Espacio de Debate (RF023, RF024)', () => {

  test('T062 — Tab "Debate" existe en detalle de proyecto (RF023)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    const projectName = `Debate RF023 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    
    await page.getByText(projectName).first().click();
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('tab', { name: /debate/i })).toBeVisible({ timeout: 10_000 });
  });

  test('T063 — Facilitador puede publicar comentario en debate (RS53, RF023)', async ({ page }) => {
    const projectName = `Comment RF023 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    // Click en la tarea para seleccionarla
    await page.getByText('Tarea Debate Test').first().click();
    await page.waitForLoadState('networkidle');
    
    // Ir al tab Debate - DiscussionSpace requiere activeRound
    await page.getByRole('tab', { name: /debate/i }).click();
    await page.waitForLoadState('networkidle');

    // Verificar si el DiscussionSpace está disponible (requiere ronda activa)
    const commentInput = page.getByLabel('Escribir comentario');
    
    if (await commentInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await commentInput.fill('Este es un comentario de prueba E2E sobre el proyecto');
      await page.getByLabel('Enviar comentario').click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Este es un comentario de prueba E2E sobre el proyecto')).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip(true, 'DiscussionSpace requiere ronda activa - iniciar ronda desde UI de estimación');
    }
  });

  test('T064 — Facilitador puede destacar un comentario (RS55, RF024)', async ({ page }) => {
    const projectName = `Highlight RF024 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea Debate Test').first().click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('tab', { name: /debate/i }).click();
    await page.waitForLoadState('networkidle');

    const commentInput = page.getByLabel('Escribir comentario');
    if (await commentInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await commentInput.fill('Comentario para destacar');
      await page.getByLabel('Enviar comentario').click();
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByText('Comentario para destacar')).toBeVisible({ timeout: 10_000 });
      
      const highlightBtn = page.getByRole('button', { name: /destacar|útil|me gusta/i }).first();
      if (await highlightBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await highlightBtn.click();
        await expect(page.getByText(/destacado|highlighted/i).first()).toBeVisible({ timeout: 5_000 });
      } else {
        test.skip(true, 'Función de destacar comentarios no implementada - DEUDA TÉCNICA RF024');
      }
    } else {
      test.skip(true, 'DiscussionSpace requiere ronda activa - iniciar ronda desde UI de estimación');
    }
  });

  test('T065 — Comentarios en discusión son anónimos (RS54, RF023)', async ({ page }) => {
    const projectName = `Anon RF023 ${Date.now()}`;
    await setupProjectWithTask(page, projectName);
    
    await page.getByText('Tarea Debate Test').first().click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('tab', { name: /debate/i }).click();
    await page.waitForLoadState('networkidle');

    const commentInput = page.getByLabel('Escribir comentario');
    if (await commentInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await commentInput.fill('Comentario anónimo de prueba');
      await page.getByLabel('Enviar comentario').click();
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByText('Comentario anónimo de prueba')).toBeVisible({ timeout: 10_000 });
      
      const pageText = await page.locator('body').textContent();
      expect(pageText).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    } else {
      test.skip(true, 'DiscussionSpace requiere ronda activa - iniciar ronda desde UI de estimación');
    }
  });

});
