import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { reactCompiler } from "../../react-compiler-vite.js";

export default defineConfig({
  plugins: [
    reactRouter(),
    tailwindcss(),
    // The docs app runs the same React Compiler output the packages ship;
    // component source assumes the compiler and does not hand-memoize.
    reactCompiler(/\/(packages|apps)\/[^]*\.tsx?$/),
  ],
  resolve: {
    alias: {
      "@comp0/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@comp0/react": fileURLToPath(new URL("../../packages/react/src/index.ts", import.meta.url)),
    },
  },
});
