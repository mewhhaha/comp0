import { glob, readFile } from "node:fs/promises";
import { transformAsync } from "@babel/core";
import babelReactCompiler from "babel-plugin-react-compiler";
import { transform } from "oxc-transform-react";

export const exceptionsPath = "packages/react/react-compiler-exceptions.json";
export const baselinePath = "packages/react/react-compiler-files.json";

const componentExport = new RegExp(
  [
    String.raw`^export\s+(?:default\s+)?(?:async\s+)?function\s+[A-Z]\w*`,
    String.raw`^export\s+const\s+[A-Z]\w*\s*(?::[^=\n]+)?=\s*(?:async\s*)?(?:\(|function\b|\w+\s*=>|(?:React\.)?(?:memo|forwardRef)\()`,
    String.raw`^export\s+class\s+[A-Z]\w*`,
  ].join("|"),
  "m",
);

/** True when the module exports a PascalCase function, const, or class (a component by convention). */
export function exportsComponent(source) {
  return componentExport.test(source);
}

/**
 * Compile every package source file with oxc-transform-react (what ships) and with
 * babel-plugin-react-compiler (the reference, which also reports why it bails out).
 */
export async function analyzeCompilerCoverage(
  pattern = "packages/{core,react,genui}/src/**/*.{ts,tsx}",
) {
  const files = [];
  for await (const file of glob(pattern)) {
    if (/\.test\.tsx?$/.test(file)) continue;
    const source = await readFile(file, "utf8");
    const native = await transform(file, source);
    if (native.fatal || !native.code) {
      throw new Error(`Native compiler failed for ${file}: ${JSON.stringify(native.errors)}`);
    }
    const events = [];
    const babel = await transformAsync(source, {
      filename: file,
      configFile: false,
      babelrc: false,
      parserOpts: { plugins: ["typescript", "jsx"] },
      plugins: [
        [
          babelReactCompiler,
          {
            target: "19",
            panicThreshold: "none",
            logger: {
              logEvent(_filename, event) {
                if (event.kind === "CompileError" || event.kind === "CompileSkip")
                  events.push(event);
              },
            },
          },
        ],
      ],
    });
    if (!babel?.code) throw new Error(`Babel compiler emitted no code for ${file}`);
    files.push({
      file,
      component: exportsComponent(source),
      native: native.code.includes("react/compiler-runtime"),
      babel: babel.code.includes("react/compiler-runtime"),
      bailouts: events.map(describeBailout),
    });
  }
  return files.sort((a, b) => (a.file < b.file ? -1 : 1));
}

function describeBailout(event) {
  if (event.kind === "CompileSkip") return `skipped: ${event.reason}`;
  const detail = event.detail ?? {};
  const reason = detail.reason ?? detail.options?.reason ?? "unknown reason";
  const description = detail.description ?? detail.options?.description;
  const loc = event.fnLoc?.start ? ` (line ${event.fnLoc.start.line})` : "";
  return `${reason}${description ? ` - ${description}` : ""}${loc}`;
}

/** Compare a compiled-file list against a reviewed baseline and describe the drift. */
export function describeBaselineDrift(actual, expected) {
  const added = actual.filter((file) => !expected.includes(file));
  const removed = expected.filter((file) => !actual.includes(file));
  if (!added.length && !removed.length) return "";
  return [
    "React Compiler file coverage changed.",
    added.length ? `newly compiled:\n  ${added.join("\n  ")}` : "",
    removed.length ? `no longer compiled:\n  ${removed.join("\n  ")}` : "",
    "Review the change, then run `pnpm compiler:baseline` to rewrite packages/react/react-compiler-files.json.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Throws with a newly compiled / no longer compiled report when the lists differ. */
export function assertBaselineMatches(actual, expected) {
  const message = describeBaselineDrift([...actual].sort(), expected);
  if (message) throw new Error(message);
}

/** Files under the built packages whose output uses the compiler runtime. */
export async function compiledDistFiles() {
  const compiled = [];
  for (const root of ["packages/core/dist", "packages/react/dist", "packages/genui/dist"]) {
    for await (const file of glob(`${root}/**/*.js`)) {
      const source = await readFile(file, "utf8");
      if (source.includes("jsxDEV")) {
        throw new Error(`Production package output contains jsxDEV: ${file}`);
      }
      if (source.includes("react/compiler-runtime")) compiled.push(file);
    }
  }
  return compiled.sort();
}
