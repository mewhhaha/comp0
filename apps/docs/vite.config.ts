import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import { unstable_reactRouterRSC } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { defineConfig } from "vite";
import { reactCompiler } from "../../react-compiler-vite.js";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
    tailwindcss(),
    // The docs app compiles only its client graph; server components stay
    // outside this transform while workspace package aliases remain compiled.
    reactCompiler(
      /\/(?:packages\/(?:core|react)\/src\/.*|apps\/docs\/src\/(?:components\/shell\/.*|components\/teaching\/(?:CodeBlockCopyButton|ComponentPreview|LessonPager|LiveExample)|examples\/(?:registry|cases\/.*)))\.[tj]sx?$/,
    ),
    unstable_reactRouterRSC(),
    react(),
    rsc({ serverHandler: false }),
  ],
  // Compiled modules import react/compiler-runtime; declare it so a cold cache
  // does not discover it mid-run and reload with a second React copy.
  optimizeDeps: {
    include: ["react/compiler-runtime"],
  },
  environments: {
    rsc: {
      optimizeDeps: {
        exclude: ["react-router"],
      },
    },
    ssr: {
      optimizeDeps: {
        exclude: ["react-router"],
      },
    },
  },
  resolve: {
    alias: {
      "@comp0/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@comp0/react": fileURLToPath(new URL("../../packages/react/src/index.ts", import.meta.url)),
    },
  },
});
