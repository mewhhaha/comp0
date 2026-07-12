import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { reactCompiler } from "./react-compiler-vite.js";

const aliases = {
  "@comp0/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
  "@comp0/react": fileURLToPath(new URL("./packages/react/src/index.ts", import.meta.url)),
};

// Tests run the same React Compiler output that ships in dist; source code
// assumes the compiler and does not hand-memoize.
const compiler = () => reactCompiler(/packages\/(core|react)\/src\/.*\.tsx?$/);

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  test: {
    projects: [
      {
        plugins: [compiler()],
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
        plugins: [compiler()],
        resolve: {
          alias: aliases,
        },
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
