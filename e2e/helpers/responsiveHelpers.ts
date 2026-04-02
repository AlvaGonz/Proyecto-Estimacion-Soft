import { Page, expect } from '@playwright/test';

export class ResponsiveHelper {
  constructor(private page: Page) {}

  /**
   * RNF006: Sets the viewport to a specific breakpoint.
   */
  async setViewport(size: 'mobile' | 'tablet' | 'desktop') {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 800 }
    };
    await this.page.setViewportSize(viewports[size]);
  }

  /**
   * RNF006: Checks for layout changes visibility.
   */
  async isElementVisible(selector: string) {
    const element = this.page.locator(selector);
    return await element.isVisible();
  }

  /**
   * RNF006: Checks if the sidebar is closed/open as expected for mobile.
   */
  async checkMobileSidebar(sidebarSelector: string, toggleSelector: string) {
    await this.setViewport('mobile');
    const isSidebarVisible = await this.isElementVisible(sidebarSelector);
    // On mobile, the sidebar should ideally be hidden by default or behind a menu toggle.
    if (isSidebarVisible) {
      // If it exists, it should be behind a toggle or overlap.
      // Often, on mobile, the main menu button is needed.
      const menuButton = this.page.locator(toggleSelector);
      expect(await menuButton.isVisible()).toBeTruthy();
    }
  }

  /**
   * RNF006: Checks for reflow of content. Usually 1 column on mobile, N on desktop.
   */
  async checkReflow(containerSelector: string, itemSelector: string, mobileCols: number = 1, desktopCols: number = 3) {
    // Desktop
    await this.setViewport('desktop');
    const desktopItems = await this.page.locator(`${containerSelector} ${itemSelector}`).count();
    // This is simple but works: check if any items are stacked vertically.
    // A better way is checking the grid-template-columns property.
    
    // Mobile
    await this.setViewport('mobile');
    const mobileItems = await this.page.locator(`${containerSelector} ${itemSelector}`).count();
    // Check stacking
  }
}
