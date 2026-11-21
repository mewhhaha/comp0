import { configure } from "@testing-library/react";
import { afterEach } from "vitest";
import { installConsoleGuard } from "./packages/react/test/console-guard.js";
import { cleanupRoots } from "./packages/react/test/render.js";

// Every render goes through StrictMode, so effects mount, unmount, and mount
// again: a listener, timer, or subscription a cleanup misses shows up here.
configure({ reactStrictMode: true });

installConsoleGuard();

afterEach(() => {
  cleanupRoots();
  document.body.innerHTML = "";
});
