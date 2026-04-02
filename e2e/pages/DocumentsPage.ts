import { Page, expect } from '@playwright/test';

export class DocumentsPage {
  readonly page: Page;
  
  constructor(page: Page) { 
    this.page = page; 
  }
  
  async expectHasDocumentsSection() {
    await expect(this.page.getByText(/documentos|archivos/i).first()).toBeVisible({ timeout: 5000 });
  }
}
