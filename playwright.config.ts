import { defineConfig, devices } from 'playwright/test';

const baseURL = process.env['E2E_BASE_URL'] || 'http://127.0.0.1:4200';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 12_000,
  },
  retries: process.env['CI'] ? 2 : 0,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    acceptDownloads: true,
  },
  webServer: process.env['E2E_SKIP_WEBSERVER'] === '1'
    ? undefined
    : {
      command: 'npm run -s start:e2e',
      url: baseURL,
      reuseExistingServer: !process.env['CI'],
      timeout: 300_000,
    },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
