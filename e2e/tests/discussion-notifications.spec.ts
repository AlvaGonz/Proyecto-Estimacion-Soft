import { test, expect } from '../fixtures/auth.fixture.ts';
import { DiscussionThreadPage } from '../pages/DiscussionThreadPage.ts';
import { NotificationCenterPage } from '../pages/NotificationCenterPage.ts';
import { ProjectDetailPage } from '../pages/ProjectDetailPage.ts';

test.describe('Hilo de Debate y Notificaciones (RF023, RF025)', () => {

  test('Discussion-001: Publicar comentario anónimo en debate técnico', async ({ expertPage: page }) => {
    const discussionPage = new DiscussionThreadPage(page);
    const projectDetail = new ProjectDetailPage(page);

    // 1. Navegar a proyectos y entrar al primero
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Click en el primer proyecto de la lista (ProjectList)
    const firstProject = page.locator('button.glass-card').first();
    await firstProject.click();
    
    // 2. Seleccionar una tarea para activar el contexto de rondas
    await projectDetail.selectFirstTask();
    
    // 3. Ir a la pestaña de Debate (usando el ID del tab o texto)
    await projectDetail.selectTab('discussion');
    
    // 4. Escribir y enviar comentario
    const commentText = `Argumento técnico E2E - ${Date.now()}`;
    await discussionPage.postComment(commentText);
    
    // 5. Verificar que el comentario aparece y tiene el badge ANON
    await discussionPage.verifyCommentExists(commentText);
    await discussionPage.verifyAnonymousBadgeVisible();
  });

  test('Notification-001: Recibir y gestionar notificaciones', async ({ expertPage: page }) => {
    const notificationPage = new NotificationCenterPage(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Simular recepción de notificación vía service (inyectando en localStorage)
    // Usamos dispatchEvent porque el service lo lanza para actualizar la UI en la misma ventana
    await page.evaluate(() => {
      const STORAGE_KEY = 'estimapro_notifications';
      const stored = localStorage.getItem(STORAGE_KEY);
      const notifications = stored ? JSON.parse(stored) : [];
      
      const newNotif = {
        id: 'notif-e2e-' + Date.now(),
        type: 'info',
        title: 'Nueva Prueba E2E',
        message: 'Esta es una notificación de prueba generada por Playwright',
        timestamp: Date.now(),
        read: false
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newNotif, ...notifications]));
      window.dispatchEvent(new CustomEvent('notifications_updated'));
    });

    // 2. Abrir centro de notificaciones
    await notificationPage.openNotifications();
    
    // 3. Verificar que la notificación de prueba es visible
    await notificationPage.verifyNotificationExists('Nueva Prueba E2E');
    await notificationPage.verifyNotificationExists('Esta es una notificación de prueba');

    // 4. Marcar todas como leídas
    await notificationPage.markAllReadButton.click();
    
    // 5. Limpiar todas y verificar estado vacío
    await notificationPage.clearNotifications();
    await notificationPage.verifyEmptyState();
  });

  test('Discussion-002: El debate no debería estar disponible sin una ronda activa', async ({ expertPage: page }) => {
    const projectDetail = new ProjectDetailPage(page);

    await page.goto('/');
    
    // Entrar al proyecto
    await page.locator('button.glass-card').first().click();
    
    // NO seleccionamos tarea (activeRound será null)
    await projectDetail.selectTab('discussion');
    
    // Debería mostrar el mensaje de "No hay ronda activa"
    await expect(page.getByText(/no hay ronda activa/i)).toBeVisible();
    await expect(page.getByText(/selecciona una tarea con rondas activas/i)).toBeVisible();
  });

});
