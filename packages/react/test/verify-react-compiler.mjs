import { readFile } from "node:fs/promises";

const files = [
  "packages/core/dist/collection.js",
  "packages/core/dist/interactions.js",
  "packages/react/dist/components/Select.js",
  "packages/react/dist/components/ListBox.js",
  "packages/react/dist/components/Calendar.js",
];

const missing = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  if (!source.includes("react/compiler-runtime")) missing.push(file);
}

if (missing.length) {
  throw new Error(`Expected React Compiler runtime imports in:\n${missing.join("\n")}`);
}

await import("../dist/index.js");
