import { test, expect } from '../fixtures/auth.fixture';
import { ResponsiveHelper } from '../helpers/responsiveHelpers';

test.describe('RNF006 Responsive Design (375px/768px/1280px)', () => {
  
  test('Mobile (375px): Sidebar should be hidden or accessible via menu', async ({ facilitadorPage }) => {
    const responsive = new ResponsiveHelper(facilitadorPage);
    await responsive.setViewport('mobile');
    await facilitadorPage.goto('/');

    // Check if high-value cards exist but maybe stacked
    const aiInsight = facilitadorPage.getByText('AI Insight Pro');
    await expect(aiInsight).toBeVisible();

    // Check if the sidebar is responsive. Usually, nav buttons might be in a hamburger menu.
    // Let's check for a menu toggle if buttons are not visible.
    const dashboardNav = facilitadorPage.getByRole('button', { name: /Dashboard/i });
    if (!(await dashboardNav.isVisible())) {
      const menuBtn = facilitadorPage.locator('button:has(svg)'); // Common hamburger pattern
      await expect(menuBtn.first()).toBeVisible();
    }
  });

  test('Tablet (768px): Dashboard cards should reflow gracefully', async ({ facilitadorPage }) => {
    const responsive = new ResponsiveHelper(facilitadorPage);
    await responsive.setViewport('tablet');
    await facilitadorPage.goto('/');

    await expect(facilitadorPage.getByText('Sesiones Recientes')).toBeVisible();
    await expect(facilitadorPage.getByText('AI Insight Pro')).toBeVisible();
  });

  test('Desktop (1280px): Sidebar should be always visible by default', async ({ facilitadorPage }) => {
    const responsive = new ResponsiveHelper(facilitadorPage);
    await responsive.setViewport('desktop');
    await facilitadorPage.goto('/');

    const dashboardNav = facilitadorPage.getByRole('button', { name: /Dashboard/i });
    const reportsNav = facilitadorPage.getByRole('button', { name: /Reportes/i });
    
    await expect(dashboardNav).toBeVisible();
    await expect(reportsNav).toBeVisible();
  });
});
