import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the main Dashboard view (view='dashboard').
 * Covers RF026–RF027: Dashboard sections and sidebar navigation.
 */
export class DashboardPage {
  readonly page: Page;

  /** "Sesiones Recientes" card heading */
  readonly recentSessionsHeading: Locator;
  /** "Trazabilidad" sidebar section heading */
  readonly traceabilityHeading: Locator;
  /** "AI Insight Pro" card heading */
  readonly aiInsightHeading: Locator;
  /** Sidebar navigation button for "Reportes" (Facilitator-only) */
  readonly reportsNavButton: Locator;
  /** Sidebar navigation button for "Proyectos" */
  readonly projectsNavButton: Locator;
  /** Sidebar navigation button for "Dashboard" */
  readonly dashboardNavButton: Locator;
  /** Sidebar navigation button for "Administración" (Admin-only) */
  readonly adminNavButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recentSessionsHeading = page.getByText('Sesiones Recientes');
    this.traceabilityHeading = page.getByText('Trazabilidad');
    this.aiInsightHeading = page.getByText('AI Insight Pro');
    this.reportsNavButton = page.getByRole('button', { name: /Reportes/i });
    this.projectsNavButton = page.getByRole('button', { name: /Proyectos/i });
    this.dashboardNavButton = page.getByRole('button', { name: /Dashboard/i });
    this.adminNavButton = page.getByRole('button', { name: /Administración/i });
  }

  /** Navigate to the Dashboard view */
  async goto() {
    await this.page.goto('/');
  }

  /** Click the "Reportes" sidebar nav button */
  async navigateToReports() {
    await this.reportsNavButton.click();
  }

  /** Click the "Proyectos" sidebar nav button */
  async navigateToProjects() {
    await this.projectsNavButton.click();
  }
}
