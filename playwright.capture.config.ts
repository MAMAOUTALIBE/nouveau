import { defineConfig, devices } from 'playwright/test';

/**
 * Config Playwright dédiée à la capture d'écrans pour la documentation
 * de présentation gouvernementale (cycle G2).
 *
 * NB : on NE démarre PAS le serveur ici (l'app doit déjà tourner en local
 * sur http://127.0.0.1:4200 avec le backend sur 8000). Cela évite les
 * conflits avec la config E2E (playwright.config.ts) qui démarre son propre
 * serveur via npm run start:e2e.
 */
const baseURL = process.env['CAPTURE_BASE_URL'] || 'http://127.0.0.1:4200';

export default defineConfig({
  testDir: './scripts',
  testMatch: 'capture_screenshots.ts',
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  retries: 0,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    headless: process.env['CAPTURE_HEADED'] !== '1',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    acceptDownloads: false,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
