import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const AUTH_FILE = path.join(__dirname, 'e2e/.auth/facilitator.json');

// storageState solo si el archivo ya existe (lo crea global-setup en la 1ra ejecución)
const storageState = fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined;

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir:     './e2e',
  timeout:     30_000,
  retries:     process.env.CI ? 2 : 0,
  workers:     process.env.CI ? 1 : undefined,
  reporter:    [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL:       'http://localhost:5173',
    storageState,                      // undefined en la 1ra ejecución — OK
    trace:         'on-first-retry',
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // ── Dos webServer separados — Playwright espera a que AMBOS respondan ──────
  webServer: [
    {
      // Backend Express en :4000
      command:             'cd server && npm run dev',
      url:                 'http://localhost:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout:             60_000,
      stdout:              'pipe',
      stderr:              'pipe',
    },
    {
      // Frontend Vite en :5173
      command:             'npm run dev',
      url:                 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout:             60_000,
      stdout:              'pipe',
      stderr:              'pipe',
    },
  ],
});
