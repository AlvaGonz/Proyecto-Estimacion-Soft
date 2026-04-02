import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Project Audit Log (tab 'audit' inside ProjectDetail).
 * Covers RNF007–RNF008: Audit log integrity, entry display, and ordering.
 */
export class AuditLogPage {
  readonly page: Page;

  /** "Registro de Auditoría" heading */
  readonly logTitle: Locator;
  /** Audit description subtitle */
  readonly logSubtitle: Locator;
  /** Timeline entry containers (each group card) */
  readonly logEntries: Locator;
  /** "Integridad Garantizada" integrity banner */
  readonly integrityBanner: Locator;
  /** "Ver datos crudos" buttons on each entry */
  readonly rawDataButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logTitle = page.getByText('Registro de Auditoría');
    this.logSubtitle = page.getByText('Trazabilidad completa del proceso Wideband Delphi.');
    this.logEntries = page.locator('.group').filter({
      has: page.locator('h4'),
    });
    this.integrityBanner = page.getByText('Integridad Garantizada');
    this.rawDataButtons = page.getByRole('button', { name: /Ver datos crudos/i });
  }

  /** Get count of visible audit log entries */
  async getEntryCount(): Promise<number> {
    return this.logEntries.count();
  }

  /** Find an entry by its action text (e.g., "Ronda Creada") */
  getEntryByAction(action: string): Locator {
    return this.logEntries.filter({ hasText: action });
  }

  /** Get all action headings text */
  async getActionTexts(): Promise<string[]> {
    const entries = this.logEntries.locator('h4');
    return entries.allTextContents();
  }
}
