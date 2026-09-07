import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";

const aliases = {
  "@comp0/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
  "@comp0/react": fileURLToPath(new URL("./packages/react/src/index.ts", import.meta.url)),
};

export default defineConfig({
  plugins: [
    react({
      compiler: true,
      include: /packages\/(core|react)\/src\/.*\.tsx?$/,
      exclude: [/node_modules/, /\.test\.[tj]sx?$/],
    }),
  ],
  server: { hmr: false },
  resolve: {
    alias: aliases,
  },
  test: {
    projects: [
      {
        test: {
          environment: "jsdom",
          exclude: ["**/*.browser.test.tsx"],
          globals: true,
          include: [
            "packages/**/*.test.ts",
            "packages/**/*.test.tsx",
            "apps/docs/src/**/*.test.ts",
            "apps/docs/src/**/*.test.tsx",
          ],
          name: "unit",
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        // Compiled modules import react/compiler-runtime; declare it so a cold
        // cache does not discover it mid-run, re-optimize, and load a second
        // React copy into the browser.
        optimizeDeps: {
          include: [
            "react",
            "react/jsx-runtime",
            "react/compiler-runtime",
            "react-dom",
            "react-dom/client",
          ],
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
