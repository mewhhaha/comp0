import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Exact matches, so a package's subpath entries resolve to their own source files.
const aliases = [
  {
    find: /^@comp0\/genui\/vocabulary$/,
    replacement: source("./packages/genui/src/composition/index.ts"),
  },
  { find: /^@comp0\/core$/, replacement: source("./packages/core/src/index.ts") },
  { find: /^@comp0\/react$/, replacement: source("./packages/react/src/index.ts") },
  { find: /^@comp0\/genui$/, replacement: source("./packages/genui/src/index.ts") },
  { find: /^@comp0\/genui\/rsc$/, replacement: source("./packages/genui/src/rsc/index.ts") },
  { find: /^@comp0\/genui\/mcp$/, replacement: source("./packages/genui/src/mcp/index.ts") },
  {
    find: /^@comp0\/genui\/rsc\/client$/,
    replacement: source("./packages/genui/src/rsc/client.tsx"),
  },
];

export default defineConfig({
  plugins: [
    react({
      compiler: true,
      include: /packages\/(core|react|genui)\/src\/.*\.tsx?$/,
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
          exclude: ["**/node_modules/**", "**/*.browser.test.tsx"],
          globals: true,
          include: [
            "packages/**/*.test.ts",
            "packages/**/*.test.tsx",
            "apps/docs/src/**/*.test.ts",
            "apps/docs/src/**/*.test.tsx",
            "scripts/**/*.test.ts",
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
            "axe-core",
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
            "packages/genui/src/**/*.browser.test.tsx",
            "apps/docs/src/**/*.browser.test.tsx",
          ],
          name: "browser",
          setupFiles: ["./vitest.browser.setup.ts"],
        },
      },
    ],
  },
});
