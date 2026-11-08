import { defineConfig } from "vitest/config";
import base, { browserProject } from "./vitest.config.js";

// Benchmarks run in the browser project's Chromium with the React Compiler on, like the
// browser tests, but stay out of `pnpm test:all` because their output is timing, not a verdict.
export default defineConfig({
  ...base,
  test: {
    // The report is console output, which vitest hides for passing tests by default.
    silent: false,
    projects: [
      {
        ...browserProject,
        test: {
          ...browserProject.test,
          name: "bench",
          include: ["packages/react/bench/**/*.bench.tsx"],
        },
      },
    ],
  },
});
