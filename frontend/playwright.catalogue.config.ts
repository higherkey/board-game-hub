import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/catalogue',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4300', browserName: 'chromium',
    channel: process.env['CI'] ? undefined : 'chrome', headless: true,
    // The production build registers the Angular service worker; keep it from caching or routing around page.route mocks.
    serviceWorkers: 'block' },
  webServer: { command: 'node ../scripts/serve-catalogue-test.cjs',
    url: 'http://127.0.0.1:4300', reuseExistingServer: false, timeout: 30000 }
});
