import { defineConfig, devices } from "@playwright/test";

// Browser smoke tests run against the production bundle served by
// `vite preview` (no cold-start dev transforms, so no flaky first loads).
// Tauri's SQL IPC is replaced by an in-memory node:sqlite database
// (see e2e/fixtures.ts).
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:1420",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "npx vite build && npx vite preview --port 1420 --strictPort --host localhost",
    url: "http://localhost:1420",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
