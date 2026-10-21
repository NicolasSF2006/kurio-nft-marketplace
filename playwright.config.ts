import { defineConfig, devices } from '@playwright/test'

const demo = process.env.E2E_MODE === 'demo'
const baseURL = demo ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  updateSnapshots: 'none',
  snapshotPathTemplate: '{testDir}/../baselines/{platform}/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.001 } },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: demo ? 'npm run build:demo && npm run preview' : 'npm run dev',
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !demo && !process.env.CI,
    env: { VITE_ENABLE_MOCKS: 'true', VITE_MOCK_SCENARIO: 'default' },
  },
})
