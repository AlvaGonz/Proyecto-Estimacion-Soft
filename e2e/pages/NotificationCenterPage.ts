import { Page, Locator } from '@playwright/test';

export class NotificationCenterPage {
  readonly page: Page;
  readonly bellButton: Locator;
  readonly notificationsContainer: Locator;
  readonly clearAllButton: Locator;
  readonly markAllReadButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bellButton = page.locator('button:has(svg.lucide-bell)');
    this.notificationsContainer = page.locator('.animate-slide-in-right');
    this.clearAllButton = page.getByText('Limpiar todo');
    this.markAllReadButton = page.getByText('Marcar todas como leídas');
    this.emptyState = page.getByText('No hay notificaciones');
  }

  async openNotifications() {
    await this.bellButton.click();
    await this.notificationsContainer.waitFor();
  }

  async closeNotifications() {
    await this.bellButton.click();
  }

  async clearNotifications() {
    await this.clearAllButton.click();
  }

  async verifyNotificationExists(message: string) {
    await this.page.waitForSelector(`text=${message}`);
  }

  async verifyEmptyState() {
    await this.emptyState.waitFor();
  }
}
