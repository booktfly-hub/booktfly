import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PORT || 3001)
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`
const useLocalServer = process.env.PLAYWRIGHT_USE_EXISTING_SERVER !== '1' && !process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: useLocalServer
    ? {
        command: `pnpm dev --port ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
