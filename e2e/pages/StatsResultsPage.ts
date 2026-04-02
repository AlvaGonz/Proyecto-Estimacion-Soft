import { expect, Page, Locator } from '@playwright/test';

export class StatsResultsPage {
  readonly page: Page;
  readonly statsContainer: Locator;
  readonly meanValue: Locator;
  readonly medianValue: Locator;
  readonly stdDevValue: Locator;
  readonly cvValue: Locator;
  readonly aiVerdict: Locator;
  readonly aiInsights: Locator;
  readonly finalizeButton: Locator;
  readonly nextRoundButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // We use getByText or partial text as data-testid is missing in some parts
    this.statsContainer = page.locator('div:has-text("Análisis Estadístico")').first();
    this.meanValue = page.locator('div:has-text("Media") p.text-lg').first();
    this.medianValue = page.locator('div:has-text("Mediana") p.text-lg').first();
    this.stdDevValue = page.locator('div:has-text("Desv. (σ)") p.text-lg').first();
    this.cvValue = page.locator('div:has-text("CV %") p.text-lg').first();
    this.aiVerdict = page.locator('span:has-text("Veredicto de Convergencia"), span:has-text("Estadísticas en Tiempo Real")').first();
    this.aiInsights = page.locator('div:has-text("Profundización de IA")').first();
    this.finalizeButton = page.getByRole('button', { name: /Finalizar Consenso/i });
    this.nextRoundButton = page.getByRole('button', { name: /Iniciar Nueva Ronda/i });
  }

  async verifyMean(expected: number) {
    await expect(this.meanValue).toContainText(expected.toFixed(2));
  }

  async verifyMedian(expected: number) {
    await expect(this.medianValue).toContainText(expected.toFixed(2));
  }

  async verifyCV(expected: number) {
    // The CV is displayed as a percentage (e.g., 4.65 -> "4.65%") or rounded in the code
    const expectedPercent = `${expected.toFixed(1)}%`;
    await expect(this.cvValue).toContainText(expectedPercent);
  }

  async verifyConvergenceLevel(level: 'Alta' | 'Media' | 'Baja') {
    const label = level === 'Alta' ? 'Convergencia Máxima' : level === 'Media' ? 'Convergencia Parcial' : 'Baja Coherencia';
    await expect(this.page.locator(`span:has-text("${label}")`)).toBeVisible();
  }

  async finalizeTask() {
    await this.finalizeButton.click();
  }

  async startNextRound() {
    await this.nextRoundButton.click();
  }
}
