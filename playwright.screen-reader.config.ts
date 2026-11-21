import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";
import { withGuidepup } from "@guidepup/playwright";

// Real screen readers against the production docs build: VoiceOver (macOS, WebKit) and NVDA
// (Windows, Chromium). Run one project per machine: `pnpm test:screen-reader:voiceover` on
// macOS, `pnpm test:screen-reader:nvda` on Windows, after `pnpm exec guidepup setup` and
// `pnpm exec guidepup install`. CI runs them in .github/workflows/screen-readers.yml.
// Build first (`pnpm build`); set DOCS_URL to test an already-running server.
const external = process.env.DOCS_URL;
const baseURL = external ?? "http://127.0.0.1:4319";

const server: Pick<PlaywrightTestConfig, "webServer"> = {};
if (!external) {
  server.webServer = {
    command:
      "pnpm --filter @comp0/docs exec vite preview --host 127.0.0.1 --port 4319 --strictPort",
    url: `${baseURL}/components/select`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  };
}

// withGuidepup runs one test at a time in a headed browser: there is one screen reader per
// machine, and readers do not see headless browsers.
export default defineConfig(
  withGuidepup({
    testDir: "./e2e-screen-reader",
    outputDir: "./.playwright/screen-reader-results",
    forbidOnly: Boolean(process.env.CI),
    // No retries: a scenario that passes only on a second try is a bug in the scenario.
    retries: 0,
    timeout: 5 * 60_000,
    reportSlowTests: null,
    expect: { timeout: 15_000 },
    reporter: process.env.CI
      ? [["list"], ["html", { open: "never", outputFolder: ".playwright/screen-reader-report" }]]
      : "list",
    use: {
      baseURL,
      actionTimeout: 30_000,
      navigationTimeout: 60_000,
      trace: "retain-on-failure",
      video: "retain-on-failure",
    },
    projects: [
      { name: "voiceover", testMatch: "voiceover.spec.ts", use: { ...devices["Desktop Safari"] } },
      { name: "nvda", testMatch: "nvda.spec.ts", use: { ...devices["Desktop Chrome"] } },
    ],
    ...server,
  }),
);
