import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const AUTH_FILE    = path.join(__dirname, 'e2e', '.auth', 'facilitator.json');
const storageState = fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined;

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir:     './e2e',
  timeout:     30_000,
  retries:     process.env.CI ? 2 : 0,
  workers:     1,
  reporter:    [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL:    'http://localhost:3001',
    storageState,
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // No webServer — servidores levantados manualmente antes de npm run e2e
});
