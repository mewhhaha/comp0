import { configure } from "@testing-library/react";
import { installConsoleGuard } from "./packages/react/test/console-guard.js";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// Same contract as the jsdom suites (vitest.setup.ts): StrictMode renders, and unexpected
// console output fails the test.
configure({ reactStrictMode: true });

// Real browser input reaches React outside act(), and React reports each update it causes; the
// assertions there wait for the DOM instead. Every other message still fails the test.
installConsoleGuard([/not wrapped in act\(/]);
