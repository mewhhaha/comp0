import { bindings, defineConfig } from "cf/config";

// The Vite plugin uploads the client build (build/client) as the Worker's static assets, so there
// is no assets directory to configure here.
export default defineConfig({
  worker: {
    name: "comp0-docs",
    compatibilityDate: "2026-07-12",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "@react-router/dev/config/default-rsc-entries/entry.rsc",
    env: {
      ASSETS: bindings.assets(),
    },
  },
});
