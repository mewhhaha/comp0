import { transform } from "oxc-transform";
import type { Plugin, Rollup } from "vite";

/**
 * Runs the React Compiler over matching modules so dev servers and tests
 * execute the same compiled output that ships in dist. Component source
 * assumes the compiler and does not hand-memoize.
 */
export function reactCompiler(filter: RegExp): Plugin {
  return {
    name: "react-compiler",
    enforce: "pre",
    async transform(code, id) {
      if (!filter.test(id)) return null;
      const result = await transform(id, code, {
        reactCompiler: { target: "19", panicThreshold: "none" },
        typescript: { onlyRemoveTypeImports: true },
        jsx: { runtime: "automatic", development: false },
        sourcemap: true,
      });

      const fatalErrors = result.errors.filter(
        (error) => error.severity === "Error" && !error.message.startsWith("[ReactCompiler]"),
      );
      if (fatalErrors.length > 0) {
        throw new Error(fatalErrors.map((error) => error.message).join("\n"));
      }
      if (!result.code) return null;

      return { code: result.code, map: (result.map ?? undefined) as Rollup.SourceMapInput };
    },
  };
}
