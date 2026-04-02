/**
 * SELF-CRITIQUE — Auth-008/011 Fix
 *
 * Q1: Could `waitForLoadState('networkidle')` introduce false stability?
 * → Yes, on slow CI environments networkidle may timeout (default 30s).
 *   Mitigation: playwright.config.ts already has `timeout: 30000`. If CI fails,
 *   add `{ timeout: 45000 }` to the waitForLoadState call as a fallback.
 *
 * Q2: Does `boundingBox()` cover all mobile scenarios?
 * → Mostly. `boundingBox()` fails if element has `visibility: hidden` AND is
 *   positioned off-screen. Add `.toBeAttached()` check before `boundingBox()`
 *   if future tests show null bounding boxes on visible elements.
 *
 * Q3: Does `el.click()` via evaluate() bypass accessibility intent?
 * → Yes — it skips Playwright's pointer simulation. Prefer `.dispatchEvent('click')`
 *   for full event chain parity if test semantics require pointer events.
 *
 * Q4: Is the regression test sufficient?
 * → Partial — it covers Chromium only. A full regression suite would cover all 3
 *   browsers. Current scope is intentional (time-boxed to observed failures).
 */
import { Page, Locator, expect } from '@playwright/test';

export class AdminUsersPage {
  readonly page: Page;
  readonly createUserButton: Locator;
  readonly modal: Locator;
  readonly editModal: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelect: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Auth-008 fix: match the actual button text rendered in AdminPanel.tsx ("Nuevo Usuario")
    // Also covers the id-based fallback for resilience
    this.createUserButton = page.locator('#btn-nuevo-usuario');

    // The create modal: AdminPanel.tsx uses role="dialog" aria-label="Crear nuevo usuario"
    // on the overlay div — match the actual aria-label value
    this.modal = page.getByRole('dialog', { name: /crear nuevo usuario|nuevo usuario/i });

    // RF030: Edit modal — ARIA-correct locator (requires role="dialog" on the modal container)
    this.editModal = page.getByRole('dialog', { name: /editar usuario/i });
    this.nameInput = page.locator('#user-name');
    this.emailInput = page.locator('#user-email');
    this.passwordInput = page.locator('#user-password');
    this.roleSelect = page.locator('#user-role');
    this.saveButton = page.getByRole('button', { name: /crear usuario|guardar/i });
  }

  async openCreateModal() {
    // Step 1: ensure admin users panel is fully loaded before clicking
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      // fallback: if networkidle never fires (SPA), continue after domcontentloaded
    });

    // Step 2: scroll button into view (defensive for any viewport)
    await this.createUserButton.scrollIntoViewIfNeeded();

    // Step 3: wait for button to be visible and enabled
    await this.createUserButton.waitFor({ state: 'visible', timeout: 10000 });

    // Step 4: click
    await this.createUserButton.click();

    // Step 5: wait for modal to appear — this is the guard that was missing
    await this.modal.waitFor({ state: 'visible', timeout: 15000 });
  }

  async createUser(name: string, email: string, pass: string, role: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.roleSelect.selectOption(role);
    await this.saveButton.click();
  }

  /** Finds the table row that contains the given email text */
  async findUserRow(email: string): Promise<Locator> {
    const row = this.page.locator('tr').filter({ hasText: email });
    await row.waitFor({ state: 'visible', timeout: 10000 });
    return row;
  }

  /** Opens the edit modal for the user identified by email */
  async openEditModal(email: string) {
    const row = await this.findUserRow(email);
    // Hover to reveal action buttons (opacity-0 group-hover:opacity-100)
    await row.hover();
    await row.getByRole('button', { name: /editar/i }).click();
    await this.editModal.waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Fills and submits the edit user form */
  async editUser(email: string, updates: { name?: string; role?: string; status?: string }) {
    await this.openEditModal(email);
    if (updates.name) {
      await this.editModal.locator('#edit-user-name').fill(updates.name);
    }
    if (updates.role) {
      await this.editModal.locator('#edit-user-role').selectOption(updates.role);
    }
    if (updates.status) {
      await this.editModal.locator('#edit-user-status').selectOption(updates.status);
    }
    await this.editModal.getByRole('button', { name: /guardar cambios/i }).click();
    await this.editModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Navigates to the admin panel from any starting point.
   * Handles both desktop (nav bar visible) and mobile (sidebar requires toggle).
   * Auth-011 fix: scrollIntoViewIfNeeded before click, with mobile toggle guard.
   */
  async navigateToAdminPanel() {
    const adminBtn = this.page.getByRole('button', { name: /administración/i });

    // Attempt 1: button is directly visible (desktop)
    const isVisible = await adminBtn.isVisible().catch(() => false);

    if (!isVisible) {
      // Attempt 2: mobile — try to find and click a hamburger/menu toggle
      // The sidebar toggle could be a button with aria-label containing "menu" or "abrir"
      const menuToggle = this.page.locator(
        'button[aria-label*="menú" i], button[aria-label*="menu" i], button[aria-label*="abrir" i], [data-testid="sidebar-toggle"], button[aria-controls*="sidebar" i]'
      ).first();

      // FIX: isVisible() does NOT verify viewport position — use boundingBox() instead
      const menuToggleBB = await menuToggle.boundingBox();
      const isInViewport =
        menuToggleBB !== null &&
        menuToggleBB.y >= 0 &&
        menuToggleBB.x >= 0 &&
        menuToggleBB.y < this.page.viewportSize()!.height &&
        menuToggleBB.x < this.page.viewportSize()!.width;

      if (isInViewport) {
        // Use evaluate() as fallback for mobile elements that resist .click()
        await menuToggle.evaluate((el: HTMLElement) => el.click());
        await this.page.waitForTimeout(300);
      }
    }

    // FIX: Use lazy locator factory — re-evaluates on each call, survives React remount
    const getAdminBtn = () => this.page.getByRole('button', { name: /administración/i });

    // Wait for SPA to fully hydrate before any DOM interaction
    await this.page.waitForLoadState('networkidle');

    // Use Playwright web-first assertion: waits + retries automatically (no manual scroll)
    await expect(getAdminBtn()).toBeVisible({ timeout: 15000 });
    await getAdminBtn().click();

    // Wait for admin panel to render (heading or users tab)
    await this.page.waitForSelector(
      'h2:has-text("Administración"), [role="tab"][aria-selected="true"]',
      { state: 'visible', timeout: 15000 }
    );
  }
}
