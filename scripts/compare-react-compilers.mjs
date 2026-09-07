import assert from "node:assert/strict";
import { glob, readFile } from "node:fs/promises";
import { transformAsync } from "@babel/core";
import babelReactCompiler from "babel-plugin-react-compiler";
import { transform } from "oxc-transform-react";

const compiled = { babel: [], native: [] };
for await (const file of glob("packages/{core,react}/src/**/*.{ts,tsx}")) {
  if (/\.test\.tsx?$/.test(file)) continue;
  const source = await readFile(file, "utf8");
  const native = await transform(file, source);
  assert(
    !native.fatal && native.code,
    `Native compiler failed for ${file}: ${JSON.stringify(native.errors)}`,
  );
  const babel = await transformAsync(source, {
    filename: file,
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
    plugins: [[babelReactCompiler, { target: "19", panicThreshold: "none" }]],
  });
  assert(babel?.code, `Babel compiler emitted no code for ${file}`);
  if (babel.code.includes("react/compiler-runtime")) compiled.babel.push(file);
  if (native.code.includes("react/compiler-runtime")) compiled.native.push(file);
}

const missing = compiled.babel.filter((file) => !compiled.native.includes(file));
assert.deepEqual(missing, [], "Native compiler skipped files compiled by Babel");

// A recoverable ref bailout must still emit executable JSX, while malformed
// source must fail instead of silently removing a module from the build.
const bailout = await transform(
  "RefBailout.tsx",
  'import { useRef } from "react"; export function RefBailout() { const ref = useRef(0); return <p>{ref.current}</p>; }',
);
assert(
  !bailout.fatal && bailout.code.includes("jsx-runtime"),
  "Ref bailout lost its fallback output",
);
assert(
  !bailout.code.includes("react/compiler-runtime"),
  "Unsafe render-time ref access was compiled",
);
const malformed = await transform("Malformed.tsx", "export function Broken( {");
assert(
  malformed.fatal && malformed.errors.length > 0,
  "Malformed source did not fail the transform",
);

console.log(
  `Compiler conformance passed: ${compiled.babel.length} Babel files, ${compiled.native.length} native files; bailout fallback and fatal diagnostics verified.`,
);
