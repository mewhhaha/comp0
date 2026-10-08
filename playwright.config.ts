import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

// The docs runtime checks run against the production build served by `vite preview`.
// Build first (`pnpm --filter @comp0/docs build`); set DOCS_URL to test an already-running server.
const external = process.env.DOCS_URL;
const baseURL = external ?? "http://127.0.0.1:4318";

const server: Pick<PlaywrightTestConfig, "webServer"> = {};
if (!external) {
  server.webServer = {
    command:
      "pnpm --filter @comp0/docs exec vite preview --host 127.0.0.1 --port 4318 --strictPort",
    url: `${baseURL}/components/select`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  };
}

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./.playwright/results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // Retries absorb load-induced timeouts on shared runners; a real regression fails every attempt.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : "50%",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: ".playwright/report" }]]
    : "list",
  use: {
    baseURL,
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  ...server,
});
