import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const clientDirectory = path.resolve(import.meta.dirname, "../apps/docs/build/client");
const inspectedExtensions = new Set([".html", ".js", ".json", ".map", ".mjs"]);
const forbiddenMarkers = [
  ["component catalog", "Wrap your Menu components in Menubar"],
  ["component catalog module", "content/catalog"],
  ["Shiki server highlighter", "ph-syntax"],
];
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else files.push(file);
  }
}

await walk(clientDirectory);

let clientJavaScriptBytes = 0;
for (const file of files) {
  if (/\.(?:js|mjs)$/.test(file)) clientJavaScriptBytes += (await stat(file)).size;
  if (!inspectedExtensions.has(path.extname(file))) continue;

  const source = await readFile(file, "utf8");
  for (const [label, marker] of forbiddenMarkers) {
    if (source.includes(marker)) {
      throw new Error(`${label} leaked into the client bundle: ${path.relative(clientDirectory, file)}`);
    }
  }
}

const spaBaselineBytes = 1_064_729;
if (clientJavaScriptBytes >= spaBaselineBytes) {
  throw new Error(
    `RSC client JavaScript did not improve on the SPA baseline: ${clientJavaScriptBytes} >= ${spaBaselineBytes}`,
  );
}

const reduction = ((1 - clientJavaScriptBytes / spaBaselineBytes) * 100).toFixed(1);
console.log(
  `Docs client bundle verified: ${clientJavaScriptBytes} JS bytes, down ${reduction}% from the ${spaBaselineBytes}-byte SPA baseline.`,
);
