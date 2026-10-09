import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { transform } from "oxc-transform-react";
import { analyzeCompilerCoverage, exceptionsPath } from "./lib/compiler-coverage.mjs";

const files = await analyzeCompilerCoverage();
const compiled = {
  babel: files.filter((f) => f.babel).map((f) => f.file),
  native: files.filter((f) => f.native).map((f) => f.file),
};

const missing = compiled.babel.filter((file) => !compiled.native.includes(file));
assert.deepEqual(missing, [], "Native compiler skipped files compiled by Babel");

// Every component module must be compiled unless it is listed, with a reason, in the exceptions file.
const exceptions = JSON.parse(await readFile(exceptionsPath, "utf8"));
const componentFiles = files.filter(
  (f) => f.component && /^packages\/(react|genui)\/src\//.test(f.file),
);
const uncompiled = componentFiles.filter((f) => !f.native);
const unlisted = uncompiled.filter((f) => !(f.file in exceptions));
const stale = Object.keys(exceptions).filter((file) => {
  const entry = files.find((f) => f.file === file);
  return !entry || entry.native || !entry.component;
});
const problems = [];
if (unlisted.length) {
  problems.push(
    `${unlisted.length} component file(s) are not compiled by oxc-transform-react:\n` +
      unlisted
        .map(
          (f) =>
            `  ${f.file}\n    bailout: ${f.bailouts.length ? f.bailouts.join("\n             ") : "none reported by babel-plugin-react-compiler (check for an unsupported pattern or no hook/JSX use)"}`,
        )
        .join("\n") +
      `\nFix the component so the compiler accepts it, or add it to ${exceptionsPath} with a reason.`,
  );
}
if (stale.length) {
  problems.push(
    `${stale.length} entr${stale.length === 1 ? "y" : "ies"} in ${exceptionsPath} no longer apply (file is compiled, removed, or not a component). Delete:\n  ${stale.join("\n  ")}`,
  );
}
if (problems.length) {
  console.error(problems.join("\n\n"));
  process.exit(1);
}

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
  `Compiler conformance passed: ${compiled.babel.length} Babel files, ${compiled.native.length} native files, ${componentFiles.length - uncompiled.length}/${componentFiles.length} component files compiled (${Object.keys(exceptions).length} listed exceptions); bailout fallback and fatal diagnostics verified.`,
);
