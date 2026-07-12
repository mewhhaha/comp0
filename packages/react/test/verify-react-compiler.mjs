import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const files = [
  "packages/core/dist/collection.js",
  "packages/core/dist/interactions.js",
  "packages/react/dist/components/Select.js",
  "packages/react/dist/components/ListBox.js",
  "packages/react/dist/components/DialogContent.js",
];

const missing = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  if (!source.includes("react/compiler-runtime")) missing.push(file);
}

if (missing.length) {
  throw new Error(`Expected React Compiler runtime imports in:\n${missing.join("\n")}`);
}

async function javascriptFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await javascriptFiles(file)));
    else if (entry.name.endsWith(".js")) files.push(file);
  }

  return files;
}

const distFiles = [
  ...(await javascriptFiles("packages/core/dist")),
  ...(await javascriptFiles("packages/react/dist")),
];
let compiledFileCount = 0;

for (const file of distFiles) {
  const source = await readFile(file, "utf8");
  if (source.includes("react/compiler-runtime")) compiledFileCount += 1;
  if (source.includes("jsxDEV")) throw new Error(`Production package output contains jsxDEV: ${file}`);
}

const babelBaseline = 105;
if (compiledFileCount < babelBaseline) {
  throw new Error(
    `React Compiler output dropped below the Babel baseline: ${compiledFileCount} < ${babelBaseline}`,
  );
}

await import("../dist/index.js");

console.log(
  `React Compiler smoke test passed: ${compiledFileCount} files (Babel baseline ${babelBaseline}).`,
);
