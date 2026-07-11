import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";

const aliases = {
  "@comp0/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
  "@comp0/react": fileURLToPath(new URL("./packages/react/src/index.ts", import.meta.url)),
};

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  test: {
    projects: [
      {
        resolve: {
          alias: aliases,
        },
        test: {
          environment: "jsdom",
          exclude: ["**/*.browser.test.tsx"],
          globals: true,
          include: [
            "packages/**/*.test.ts",
            "packages/**/*.test.tsx",
            "apps/docs/src/**/*.test.ts",
          ],
          name: "unit",
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        resolve: {
          alias: aliases,
        },
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright(),
          },
          include: [
            "packages/react/src/**/*.browser.test.tsx",
            "apps/docs/src/**/*.browser.test.tsx",
          ],
          name: "browser",
          setupFiles: ["./vitest.browser.setup.ts"],
        },
      },
    ],
  },
});
