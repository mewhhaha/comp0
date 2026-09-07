import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import { unstable_reactRouterRSC } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
    tailwindcss(),
    unstable_reactRouterRSC(),
    react({ compiler: true }),
    rsc({ serverHandler: false }),
  ],
  environments: {
    client: {
      build: { manifest: "client-manifest.json" },
    },
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
