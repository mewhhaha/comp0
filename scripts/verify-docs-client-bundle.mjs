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
      throw new Error(
        `${label} leaked into the client bundle: ${path.relative(clientDirectory, file)}`,
      );
    }
  }
}

const manifest = JSON.parse(
  await readFile(path.join(clientDirectory, "client-manifest.json"), "utf8"),
);
const sharedChunks = new Set();
function collectImports(key, chunks) {
  if (chunks.has(key)) return;
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Client manifest is missing imported chunk ${key}`);
  chunks.add(key);
  for (const imported of chunk.imports ?? []) collectImports(imported, chunks);
}

const exampleGroups = new Map();
for (const [key, chunk] of Object.entries(manifest)) {
  if (chunk.src?.includes("/examples/cases/")) {
    const slug = path.basename(chunk.src).split(".")[0];
    const examples = exampleGroups.get(slug) ?? [];
    examples.push(key);
    exampleGroups.set(slug, examples);
  } else if (chunk.isEntry || chunk.isDynamicEntry) {
    collectImports(key, sharedChunks);
  }
}
if (sharedChunks.size === 0 || exampleGroups.size === 0) {
  throw new Error("Client manifest must contain entry chunks and lazily loaded component examples");
}
for (const key of sharedChunks) {
  if (manifest[key].src?.includes("/examples/cases/")) {
    throw new Error(`Example is eagerly imported by the shared client graph: ${key}`);
  }
}

let largestPageBytes = 0;
let largestPage;
for (const [slug, examples] of exampleGroups) {
  const chunks = new Set(sharedChunks);
  for (const key of examples) collectImports(key, chunks);
  let bytes = 0;
  for (const key of chunks)
    bytes += (await stat(path.join(clientDirectory, manifest[key].file))).size;
  if (bytes > largestPageBytes) {
    largestPageBytes = bytes;
    largestPage = slug;
  }
}

const spaBaselineBytes = 1_175_440;
if (largestPageBytes >= spaBaselineBytes) {
  throw new Error(
    `Docs page ${largestPage} exceeds the SPA baseline: ${largestPageBytes} >= ${spaBaselineBytes}`,
  );
}

const reduction = ((1 - largestPageBytes / spaBaselineBytes) * 100).toFixed(1);
console.log(
  `Docs client bundle verified: largest component page ${largestPage} loads at most ${largestPageBytes} JS bytes, down ${reduction}% from the SPA baseline (${clientJavaScriptBytes} bytes across all lazy chunks).`,
);
