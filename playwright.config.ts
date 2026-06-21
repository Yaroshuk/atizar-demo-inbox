import { defineConfig, devices } from '@playwright/test'

// Browser E2E for the inbox DEMO app: getByTestId, page objects, hit a RUNNING dev server.
//
// The demo flow (`npm run demo`) serves the client on :5173 with committed synthetic cassettes
// (demo-cassettes/) + faked effects — fully deterministic, no real claude / Gmail. `webServer`
// below boots that stack for the run; if you already have `npm run demo` up on :5173 it attaches
// to it instead.
//
//   npm run ui          (headed)
//   npm run ui:smoke    (headless)

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts$/,
  // The demo server holds ONE shared state and the sorter is a singleton — specs run serially
  // (a per-test reset, see e2e/fixtures.ts, gives each a clean slate).
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Boot the demo stack for the run; reuse an already-running `npm run demo` if present.
  webServer: {
    command: 'DEMO=1 npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
