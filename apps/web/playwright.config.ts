import { defineConfig, devices } from "@playwright/test"

const API_URL = process.env.API_URL || "http://localhost:3001"
const WEB_URL = process.env.WEB_URL || "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter api run start:dev",
      url: API_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // E2E flows fire many API calls per page load; raise the throttle
      // window so the global 30 req/60s guard (SRS NFR-SEC-05) doesn't trip.
      env: { THROTTLE_LIMIT: "500" },
    },
    {
      command: "pnpm --filter web run dev",
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
