import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

// The docs build uses Vite. Its Node-side format and llms.txt scripts read the same content,
// including verbatim source for examples, without loading React client or server modules.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error?.code === "ERR_MODULE_NOT_FOUND" && /^\.\.?\/.*\.js$/.test(specifier)) {
        return nextResolve(specifier.replace(/\.js$/, ".ts"), context);
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith("?raw")) {
      const source = readFileSync(new URL(url), "utf8");
      return {
        format: "module",
        source: `export default ${JSON.stringify(source)}`,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
