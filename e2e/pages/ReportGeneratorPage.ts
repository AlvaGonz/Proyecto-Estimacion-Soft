import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Report Generator view (view='reports').
 * Covers RF028–RF030: Report configuration, generation, and history.
 */
export class ReportGeneratorPage {
  readonly page: Page;

  /** Page heading "Reportes" */
  readonly pageHeading: Locator;
  /** "Nuevo Informe" tab button */
  readonly createTab: Locator;
  /** "Historial" tab button */
  readonly historyTab: Locator;
  /** Project dropdown selector (#project-selector) */
  readonly projectSelector: Locator;
  /** PDF format toggle button */
  readonly formatPDF: Locator;
  /** EXCEL format toggle button */
  readonly formatExcel: Locator;
  /** Detail option toggle buttons (Stats, History, Justifications, Charts) */
  readonly optionToggles: {
    Stats: Locator;
    History: Locator;
    Justifications: Locator;
    Charts: Locator;
  };
  /** Audit log include toggle button */
  readonly auditToggle: Locator;
  /** "Generar Reporte Profesional" button */
  readonly generateButton: Locator;
  /** "Historial Local" heading (visible in history tab) */
  readonly historyLocalHeading: Locator;
  /** "Limpiar Todo" button in history tab */
  readonly clearHistoryButton: Locator;
  /** Empty history state text */
  readonly emptyHistoryState: Locator;
  /** History report cards container */
  readonly historyCards: Locator;
  /** "Certificación UCE" sidebar info card */
  readonly certificationCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByRole('heading', { name: 'Reportes' });
    this.createTab = page.getByRole('button', { name: /Nuevo Informe/i });
    this.historyTab = page.getByRole('button', { name: /Historial/i }).first();
    this.projectSelector = page.locator('#project-selector');
    this.formatPDF = page.getByRole('button', { name: /PDF/i });
    this.formatExcel = page.getByRole('button', { name: /EXCEL/i });
    this.optionToggles = {
      Stats: page.getByRole('button', { name: /^Stats$/i }),
      History: page.getByRole('button', { name: /^History$/i }),
      Justifications: page.getByRole('button', { name: /^Justifications$/i }),
      Charts: page.getByRole('button', { name: /^Charts$/i }),
    };
    this.auditToggle = page.locator('button').filter({ has: page.locator('.rounded-full') }).last();
    this.generateButton = page.getByRole('button', { name: /Generar Reporte Profesional/i });
    this.historyLocalHeading = page.getByText('Historial Local');
    this.clearHistoryButton = page.getByRole('button', { name: /Limpiar Todo/i });
    this.emptyHistoryState = page.getByText('Historial de Reportes Vacío');
    this.historyCards = page.locator('[class*="grid"] > div').filter({ has: page.getByRole('button', { name: /Redescargar/i }) });
    this.certificationCard = page.getByText('Certificación UCE');
  }

  /** Select a project by its visible label */
  async selectProject(name: string) {
    await this.projectSelector.selectOption({ label: name });
  }

  /** Select report format (PDF or EXCEL) */
  async selectFormat(format: 'PDF' | 'EXCEL') {
    if (format === 'PDF') {
      await this.formatPDF.click();
    } else {
      await this.formatExcel.click();
    }
  }

  /** Toggle a detail option */
  async toggleOption(key: keyof typeof this.optionToggles) {
    await this.optionToggles[key].click();
  }

  /** Toggle the audit log inclusion switch */
  async toggleAudit() {
    await this.auditToggle.click();
  }

  /** Click the generate report button */
  async generate() {
    await this.generateButton.click();
  }

  /** Switch to the history tab */
  async switchToHistory() {
    await this.historyTab.click();
  }

  /** Switch to the create tab */
  async switchToCreate() {
    await this.createTab.click();
  }
}
