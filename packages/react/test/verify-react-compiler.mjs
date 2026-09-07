import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

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
const compiledFiles = [];

for (const file of distFiles) {
  const source = await readFile(file, "utf8");
  if (source.includes("react/compiler-runtime")) compiledFiles.push(file);
  if (source.includes("jsxDEV"))
    throw new Error(`Production package output contains jsxDEV: ${file}`);
}

const expectedFiles = JSON.parse(
  await readFile("packages/react/react-compiler-files.json", "utf8"),
);
assert.deepEqual(
  compiledFiles.sort(),
  expectedFiles,
  "React Compiler file coverage changed; run the Babel comparison and review the baseline",
);

await import("../dist/index.js");

console.log(
  `React Compiler smoke test passed: ${compiledFiles.length} files match the reviewed baseline.`,
);
