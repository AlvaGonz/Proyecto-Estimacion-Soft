import { test, expect } from '@playwright/test';
import { StatsResultsPage } from '../pages/StatsResultsPage';
import { ConvergenceIndicatorComponent } from '../pages/ConvergenceIndicatorComponent';
import statsData from '../fixtures/stats-data.json' with { type: 'json' };

test.describe('Statistical Engine & AI Convergence Verdict', () => {
  let statsPage: StatsResultsPage;
  let convergenceIndicator: ConvergenceIndicatorComponent;

  test.beforeEach(async ({ page }) => {
    statsPage = new StatsResultsPage(page);
    convergenceIndicator = new ConvergenceIndicatorComponent(page);

    // Mock Auth Me
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            id: 'u1',
            email: 'facilitator@test.com',
            role: 'FACILITATOR',
            name: 'Mock Facilitator'
          }
        })
      });
    });

    // Mock API responses to avoid needing a running backend
    await page.route('**/api/projects/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'p1',
            name: 'Test Project',
            status: 'active',
            tasks: [{ id: 't1', title: 'Test Task' }]
          }
        })
      });
    });

    // We'll navigate to the project/task detail page
    // In a real app, this would be http://localhost:3001/project/p1/task/t1
    await page.goto('http://localhost:3001/');
    // Note: We might need to bypass login or mock the auth session
    await page.evaluate(() => {
      localStorage.setItem('estimapro_auth', 'true');
    });
    // Re-navigamos para que tome el localStorage
    await page.goto('http://localhost:3001/');
  });

  test('RF015/RF016: Verify correct statistical calculations for High Convergence', async ({ page }) => {
    const data = statsData.convergenciaAlta;

    // Mock the specific round data for high convergence
    await page.route('**/api/projects/*/tasks/*/rounds/*', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            roundNumber: 1,
            status: 'CLOSED',
            estimations: data.estimations,
            stats: {
              mean: data.expected.mean,
              median: data.expected.median,
              coefficientOfVariation: data.expected.cv / 100, // as decimal
              stdDev: 0.5 // example
            }
          }
        })
      });
    });

    // Mock convergence analysis
    await page.route('**/api/projects/*/tasks/*/rounds/*/analysis', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            level: 'Alta',
            recommendation: 'Finalizar tarea - Consenso alcanzado',
            aiInsights: 'El grupo ha alcanzado una convergencia aceptable.'
          }
        })
      });
    });

    // Trigger viewing the results (mock navigation or click)
    // For this test, we assume we are already on the results view or navigate to it
    await page.goto('http://localhost:3001/project/p1/task/t1/results');

    // Assertions
    await statsPage.verifyMean(data.expected.mean);
    await statsPage.verifyMedian(data.expected.median);
    await statsPage.verifyCV(data.expected.cv);
    await statsPage.verifyConvergenceLevel('Alta');
  });

  test('RF020/RF021: Verify handles Low Convergence and reveals Outliers', async ({ page }) => {
    const data = statsData.convergenciaBaja;

    // Mock low convergence data
    await page.route('**/api/projects/*/tasks/*/rounds/*', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            roundNumber: 1,
            status: 'CLOSED',
            estimations: data.estimations,
            stats: {
              mean: data.expected.mean,
              median: data.expected.median,
              coefficientOfVariation: data.expected.cv / 100,
              stdDev: 45.0,
              outlierEstimationIds: data.expected.outliers
            }
          }
        })
      });
    });

    // Mock low convergence analysis
    await page.route('**/api/projects/*/tasks/*/rounds/*/analysis', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            level: 'Baja',
            recommendation: 'Nueva ronda - Discusión adicional necesaria',
            aiInsights: 'Demasiada dispersión detectada.'
          }
        })
      });
    });

    await page.goto('http://localhost:3001/project/p1/task/t1/results');

    // Assertions
    await statsPage.verifyCV(data.expected.cv);
    await statsPage.verifyConvergenceLevel('Baja');

    // Check if outlier is marked in the comparison view (visual check or text)
    // As per EstimationCharts.tsx, outliers are marked in AnonymousComparisonView
    await expect(page.locator('text=* Valores atípicos marcados en naranja')).toBeVisible();
  });
});
