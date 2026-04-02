import { expect, Page, Locator } from '@playwright/test';

export class ConvergenceIndicatorComponent {
  readonly page: Page;
  readonly indicator: Locator;
  readonly label: Locator;

  constructor(page: Page) {
    this.page = page;
    this.indicator = page.locator('span:has-text("Convergencia Máxima"), span:has-text("Convergencia Parcial"), span:has-text("Baja Coherencia")').first();
  }

  async verifyLevel(level: 'Alta' | 'Media' | 'Baja') {
    const label = level === 'Alta' ? 'Convergencia Máxima' : level === 'Media' ? 'Convergencia Parcial' : 'Baja Coherencia';
    await expect(this.page.locator(`span:has-text("${label}")`)).toBeVisible();
  }

  async verifyRecommendation(recommendation: string) {
    await expect(this.page.locator(`text=${recommendation}`)).toBeVisible();
  }
}
