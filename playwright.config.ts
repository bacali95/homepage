import { defineConfig, devices } from "@playwright/test";

const PORT = 3111;
const DB_PATH = ".e2e/e2e.db";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Runs the production build exactly like start.sh, against a throwaway DB.
  webServer: {
    command: `rm -rf .e2e && mkdir -p .e2e && sh ./start.sh`,
    url: `http://localhost:${PORT}/healthz`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "production",
      PORT: String(PORT),
      DATABASE_URL: `file:./${DB_PATH}`,
    },
  },
});
