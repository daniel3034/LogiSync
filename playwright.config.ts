import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Local secrets: `.env` holds ADMIN_EMAIL / ADMIN_PASSWORD; `.env.local` may
// override AUTH_SECRET and similar. Load both so e2e matches `pnpm dev`.
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const baseURL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  // Intentionally no webServer — same model as `pnpm test:price`: point
  // BASE_URL at a running local `pnpm dev` (default http://localhost:3000).
});
