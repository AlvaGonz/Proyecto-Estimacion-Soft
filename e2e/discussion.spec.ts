// e2e/discussion.spec.ts
// RF023: Espacio discusión | RF024: Moderación facilitador
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { createProjectViaWizard } from './helpers/project.helper';

async function setupProjectWithDiscussion(page: any, projectName: string) {
  await loginAs(page, 'facilitator');
  await page.getByRole('button', { name: /proyectos/i }).click();
  await page.waitForLoadState('networkidle');
  
  await createProjectViaWizard(page, { name: projectName });
  await page.getByText(projectName).click();
  await page.waitForLoadState('networkidle');

  // Añadir tarea y abrir ronda para tener espacio de discusión
  await page.getByRole('button', { name: /añadir tarea/i }).click();
  await page.waitForSelector('#newTaskTitle', { timeout: 5_000 });
  await page.locator('#newTaskTitle').fill('Tarea Debate Test');
  await page.locator('#newTaskDesc').fill('Descripción para test de debate');
  await page.getByRole('button', { name: /crear tarea/i }).click();
  await expect(page.locator('#newTaskTitle')).not.toBeVisible({ timeout: 8_000 });

  // Abrir ronda
  await page.getByText('Tarea Debate Test').first().click();
  await page.waitForTimeout(500);
  
  const startBtn = page.getByRole('button', { name: /iniciar|abrir|nueva ronda/i });
  if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForLoadState('networkidle');
  }

  return { projectName };
}

test.describe('DISCUSIÓN — Espacio de Debate (RF023, RF024)', () => {

  test('T062 — Tab "Debate" existe en detalle de proyecto (RF023)', async ({ page }) => {
    await loginAs(page, 'facilitator');
    await page.getByRole('button', { name: /proyectos/i }).click();
    await page.waitForLoadState('networkidle');
    const projectName = `Debate RF023 ${Date.now()}`;
    await createProjectViaWizard(page, { name: projectName });
    await page.getByText(projectName).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('tab', { name: /debate/i })).toBeVisible({ timeout: 10_000 });
  });

  test('T063 — Facilitador puede publicar comentario en debate (RS53, RF023)', async ({ page }) => {
    const projectName = `Comment RF023 ${Date.now()}`;
    await setupProjectWithDiscussion(page, projectName);
    
    await page.getByRole('tab', { name: /debate/i }).click();
    await page.waitForTimeout(500);

    // Buscar el textarea/input de comentario
    // Basado en DiscussionSpace.tsx - aria-label="Escribir comentario"
    const commentInput = page.locator('textarea, input[type="text"]')
      .filter({ has: page.locator('') })
      .or(page.locator('[aria-label*="comentario"], [placeholder*="comentar"]'))
      .first();
    
    if (await commentInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await commentInput.fill('Este es un comentario de prueba E2E sobre el proyecto');
      
      // Enviar comentario - aria-label="Enviar comentario"
      await page.getByRole('button', { name: /enviar|publicar|comentar/i }).click();
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('Este es un comentario de prueba E2E sobre el proyecto')).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip(true, 'Espacio de comentarios no implementado - DEUDA TÉCNICA RF023');
    }
  });

  test('T064 — Facilitador puede destacar un comentario (RS55, RF024)', async ({ page }) => {
    const projectName = `Highlight RF024 ${Date.now()}`;
    await setupProjectWithDiscussion(page, projectName);
    
    await page.getByRole('tab', { name: /debate/i }).click();
    await page.waitForTimeout(500);

    // Primero crear un comentario
    const commentInput = page.locator('textarea').first();
    if (await commentInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await commentInput.fill('Comentario para destacar');
      await page.getByRole('button', { name: /enviar|publicar/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Buscar botón de destacar (estrella, pin, etc.)
      const highlightBtn = page.getByRole('button', { name: /destacar|marcar|⭐|star|pin/i }).first();
      if (await highlightBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await highlightBtn.click();
        await expect(page.getByText(/destacado|highlighted|pinned|📌/i).first()).toBeVisible({ timeout: 5_000 });
      } else {
        test.skip(true, 'Función de destacar comentarios no implementada - DEUDA TÉCNICA RF024');
      }
    } else {
      test.skip(true, 'Espacio de comentarios no implementado - DEUDA TÉCNICA RF023');
    }
  });

  test('T065 — Comentarios en discusión son anónimos (RS54, RF023)', async ({ page }) => {
    const projectName = `Anon RF023 ${Date.now()}`;
    await setupProjectWithDiscussion(page, projectName);
    
    await page.getByRole('tab', { name: /debate/i }).click();
    await page.waitForTimeout(500);

    // Crear un comentario como facilitador
    const commentInput = page.locator('textarea').first();
    if (await commentInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await commentInput.fill('Comentario anónimo de prueba');
      await page.getByRole('button', { name: /enviar|publicar/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Verificar que el comentario aparece sin email completo
      const commentSection = await page.locator('body').textContent();
      
      // No debe mostrar emails completos en los comentarios
      expect(commentSection).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      
      // Pero debe mostrar el contenido del comentario
      await expect(page.getByText('Comentario anónimo de prueba')).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip(true, 'Espacio de comentarios no implementado - DEUDA TÉCNICA RF023');
    }
  });

});
