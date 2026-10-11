import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import { unstable_reactRouterRSC } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { defineConfig, type PluginOption } from "vite";

// @vitejs/plugin-rsc 0.5.36 writes the client assets manifest in an `order: "post"` generateBundle
// hook. React Router's client-version plugin reads it in another post hook, and post hooks run in
// plugin order with React Router required before rsc(), so the read came first and the build
// failed with "Vite RSC assets manifest not found". Only that reader moves after rsc().
const reactRouterPlugins = unstable_reactRouterRSC();
const readsAssetsManifest = (plugin: PluginOption) =>
  typeof plugin === "object" &&
  plugin !== null &&
  "name" in plugin &&
  plugin.name === "react-router/rsc/virtual-client-version";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
    tailwindcss(),
    reactRouterPlugins.filter((plugin) => !readsAssetsManifest(plugin)),
    react({ compiler: true }),
    rsc({ serverHandler: false }),
    reactRouterPlugins.filter(readsAssetsManifest),
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
      "@comp0/genui": fileURLToPath(new URL("../../packages/genui/src/index.ts", import.meta.url)),
      "@comp0/react": fileURLToPath(new URL("../../packages/react/src/index.ts", import.meta.url)),
    },
  },
});
