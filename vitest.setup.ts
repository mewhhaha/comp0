import { afterEach } from "vitest";
import { cleanupRoots } from "./packages/react/test/render.js";

afterEach(() => {
  cleanupRoots();
  document.body.innerHTML = "";
});
