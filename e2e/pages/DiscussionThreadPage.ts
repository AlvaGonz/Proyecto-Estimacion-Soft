import { Page, Locator } from '@playwright/test';

export class DiscussionThreadPage {
  readonly page: Page;
  readonly commentInput: Locator;
  readonly sendButton: Locator;
  readonly commentsList: Locator;
  readonly anonymousBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.commentInput = page.getByLabel('Escribir comentario');
    this.sendButton = page.getByLabel('Enviar comentario');
    this.commentsList = page.locator('div.grid-cols-1 >> div.lg\\:col-span-8 >> div.space-y-10');
    this.anonymousBadge = page.getByText('ANON');
  }

  async postComment(content: string) {
    await this.commentInput.fill(content);
    await this.sendButton.click();
  }

  async verifyCommentExists(content: string) {
    await this.page.waitForSelector(`text=${content}`);
  }

  async verifyAnonymousBadgeVisible() {
    await this.anonymousBadge.first().waitFor();
  }
}
