import { Page, Locator } from '@playwright/test';

export class ProjectDetailPage {
  readonly page: Page;
  readonly tabButtons: { [key: string]: Locator };
  readonly firstTaskButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabButtons = {
      tasks: page.locator('#tab-tasks'),
      docs: page.locator('#tab-docs'),
      discussion: page.locator('#tab-discussion'),
      team: page.locator('#tab-team'),
      audit: page.locator('#tab-audit'),
    };
    this.firstTaskButton = page.locator('div.lg\\:col-span-4 >> button').first();
  }

  async selectTab(tab: string) {
    await this.tabButtons[tab].click();
  }

  async selectFirstTask() {
    await this.firstTaskButton.click();
  }
}
