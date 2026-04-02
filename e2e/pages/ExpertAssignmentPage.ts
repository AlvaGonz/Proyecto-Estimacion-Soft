import { Page, Locator, expect } from '@playwright/test';

export class ExpertAssignmentPage {
  readonly page: Page;
  readonly header: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('h4:has-text("Asignar Expertos")');
  }

  async waitForLoad() {
    await this.header.waitFor({ state: 'visible', timeout: 8000 });
    await this.page.waitForTimeout(2000); // Give API time to settle
    
    const noExperts = await this.page.getByText(/no hay expertos registrados/i)
      .isVisible({ timeout: 1000 }).catch(() => false);
      
    if (noExperts) {
      await this.page.screenshot({ path: 'playwright-report/experts-load-error.png' });
      throw new Error('ExpertAssignmentPage: Experts failed to load.');
    }
  }

  async selectExpertByName(name: string) {
    const btn = this.page.getByText(new RegExp(name, 'i')).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
    } else {
      throw new Error(`Expert ${name} not found to assign.`);
    }
  }

  async selectFirstAvailableExpert() {
    const firstExpert = this.page.locator('button:has-text("@")').first();
    await firstExpert.waitFor({ state: 'visible', timeout: 5000 });
    await firstExpert.click();
  }

  async selectAllExperts() {
    // Los expertos creados en global-setup.ts empiezan con "E2E Experto"
    // En ProjectForm.tsx, cada experto es un <button> con aria-label que contiene el nombre
    const experts = this.page.locator('button[aria-label*="E2E Experto"]');
    
    // Esperar a que al menos uno sea visible
    await experts.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        console.error('ExpertAssignmentPage: No se encontraron botones de expertos E2E');
    });

    const count = await experts.count();
    console.log(`ExpertAssignmentPage: Encontrados ${count} expertos E2E`);

    for (let i = 0; i < count; i++) {
        const btn = experts.nth(i);
        const name = await btn.getAttribute('aria-label');
        
        // Verificar si está seleccionado (clase 'border-delphi-keppel' según ProjectForm.tsx:L807)
        const isSelected = (await btn.getAttribute('class'))?.includes('border-delphi-keppel');
        
        if (!isSelected) {
            console.log(`ExpertAssignmentPage: Seleccionando experto ${name}`);
            await btn.click();
            await this.page.waitForTimeout(200); // Pequeña espera para estado React
        } else {
            console.log(`ExpertAssignmentPage: Experto ${name} ya estaba seleccionado`);
        }
    }
  }

  async verifySelectionCount(expectedCount: number) {
    await expect(this.page.getByText(new RegExp(`seleccionados:\\s*${expectedCount}`, 'i'))).toBeVisible({ timeout: 5000 });
  }
}
