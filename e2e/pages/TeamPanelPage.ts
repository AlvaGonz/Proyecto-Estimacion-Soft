import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Team Panel (tab 'team' inside ProjectDetail).
 * Covers RF033: Expert performance metrics display.
 */
export class TeamPanelPage {
  readonly page: Page;

  /** "Panel de Expertos" heading */
  readonly panelTitle: Locator;
  /** "Compromiso Global" label */
  readonly globalCommitmentLabel: Locator;
  /** Commitment percentage value text */
  readonly globalCommitmentValue: Locator;
  /** Expert stat cards (glass-card containers) */
  readonly expertCards: Locator;
  /** All progress bars in the panel */
  readonly progressBars: Locator;
  /** "IA Performance Analyzer" footer banner */
  readonly aiAnalyzerBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panelTitle = page.getByText('Panel de Expertos');
    this.globalCommitmentLabel = page.getByText('Compromiso Global');
    // The commitment value is the sibling span inside the same parent
    this.globalCommitmentValue = page.locator('span:has-text("Compromiso Global") + span');
    this.expertCards = page.locator('.glass-card').filter({ has: page.getByText('Índice IQ') });
    this.progressBars = page.locator('[role="progressbar"]');
    this.aiAnalyzerBanner = page.getByText('IA Performance Analyzer');
  }

  /** Get count of expert cards displayed */
  async getExpertCount(): Promise<number> {
    return this.expertCards.count();
  }

  /** Get the metric value for a specific label (e.g., 'Ritmo', 'Feedback', 'Delay') */
  getMetricValue(label: string): Locator {
    return this.page
      .locator(`p:has-text("${label}")`)
      .locator('xpath=following-sibling::p')
      .first();
  }

  /** Get the expert card by name */
  getExpertCard(name: string): Locator {
    return this.expertCards.filter({ hasText: name });
  }
}
