import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_FILE = path.join(__dirname, 'e2e', '.auth', 'facilitator.json');
const storageState = fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined;

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  // globalTeardown: './e2e/global-teardown.ts',
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: 'http://127.0.0.1:3001',
    storageState,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // RNF001: HTTPS enforced by Nginx — verified in e2e/tests/infra/https.spec.ts (Session 2)
    ignoreHTTPSErrors: true,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } }, // RNF006 responsive
  ],
  // No webServer — servidores levantados manualmente antes de npm run e2e
});
