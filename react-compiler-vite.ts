import { transformAsync } from "@babel/core";
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
      const result = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        presets: ["@babel/preset-typescript", ["@babel/preset-react", { runtime: "automatic" }]],
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
        sourceMaps: true,
      });
      if (!result?.code) return null;
      // Babel 8 and rolldown-vite disagree on the encoded source map type.
      return { code: result.code, map: (result.map ?? undefined) as Rollup.SourceMapInput };
    },
  };
}
