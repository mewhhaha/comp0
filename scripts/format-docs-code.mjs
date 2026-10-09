import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { format } from "oxfmt";

// Entry files import siblings as "./define.js" for the bundler; map those to the .ts source so
// Node's native type stripping can load them without starting Vite.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error?.code === "ERR_MODULE_NOT_FOUND" && /^\.\.?\/.*\.js$/.test(specifier)) {
        return nextResolve(specifier.replace(/\.js$/, ".ts"), context);
      }
      throw error;
    }
  },
});

const contentDirectory = "apps/docs/src/content/components";
const entryPath = (slug) => `${contentDirectory}/${slug}.ts`;
const components = await Promise.all(
  readdirSync(contentDirectory)
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .sort()
    .map(async (file) => {
      const module = await import(pathToFileURL(`${contentDirectory}/${file}`).href);
      return module.default;
    }),
);
const { learnDocs } = await import(pathToFileURL("apps/docs/src/content/learn.ts").href);

const check = process.argv.includes("--check");
const oxfmt =
  process.platform === "win32" ? "node_modules/.bin/oxfmt.cmd" : "node_modules/.bin/oxfmt";

// The oxfmt CLI reads .oxfmtrc.json; the API takes the same options directly.
const {
  ignorePatterns: _ignored,
  $schema: _schema,
  ...formatOptions
} = JSON.parse(readFileSync(".oxfmtrc.json", "utf8"));

function runOxfmt(args) {
  return spawnSync(oxfmt, args, { cwd: process.cwd(), encoding: "utf8" });
}

async function formatSnippet(source, language, name) {
  if (language === "bash" || language === "json") return source;
  const extension = language === "css" ? "css" : "tsx";
  let result = await format(`code-block.${extension}`, source, formatOptions);
  if (result.errors.length > 0 && extension === "tsx") {
    result = await format("code-block.tsx", `<>\n${source}\n</>`, formatOptions);
  }
  if (result.errors.length > 0) {
    const reasons = result.errors.map((error) => error.message).join("\n");
    throw new Error(`oxfmt could not parse ${name}:\n${reasons}`);
  }
  return result.code.trimEnd();
}

function singleQuoted(source) {
  return `'${source
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll("\r", "\\r")
    .replaceAll("\n", "\\n")}'`;
}

function backtickQuoted(source) {
  return `\`${source
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${")
    .replaceAll("\r", "\\r")
    .replaceAll("\n", "\\n")}\``;
}

async function replaceCodeBlocks(path, blocks) {
  const original = readFileSync(path, "utf8");
  let next = original;
  const changes = [];
  const uniqueBlocks = new Map(blocks.map((block) => [block.source, block]));

  const unique = [...uniqueBlocks.values()];
  const formattedBlocks = await Promise.all(
    unique.map((block) => formatSnippet(block.source, block.language, block.name)),
  );

  for (const [index, block] of unique.entries()) {
    const formatted = formattedBlocks[index];
    if (formatted === block.source.trimEnd()) continue;
    const replacement = JSON.stringify(formatted);
    const candidates = [
      JSON.stringify(block.source),
      singleQuoted(block.source),
      backtickQuoted(block.source),
    ];
    const literal = candidates.find((candidate) => next.includes(candidate));
    if (!literal) {
      throw new Error(`Could not locate the source literal for ${block.name} in ${path}.`);
    }
    next = next.replaceAll(literal, replacement);
    changes.push(block.name);
  }

  if (next === original) return [];
  if (!check) writeFileSync(path, next);
  return changes;
}

function codeBlock(name, source, language) {
  if (!source) return [];
  return [{ name, source, language: language ?? "tsx" }];
}

const learnBlocks = learnDocs.flatMap((document) =>
  document.sections.flatMap((section) =>
    codeBlock(`learn/${document.slug}/${section.id}`, section.code, section.language),
  ),
);
const catalogChanges = (
  await Promise.all(
    components.map((component) =>
      replaceCodeBlocks(
        entryPath(component.slug),
        component.steps.flatMap((step, index) =>
          codeBlock(`components/${component.slug}/step-${index + 1}`, step.code, step.language),
        ),
      ),
    ),
  )
).flat();

const changedBlocks = [
  ...(await replaceCodeBlocks("apps/docs/src/content/learn.ts", learnBlocks)),
  ...catalogChanges,
];
if (check && changedBlocks.length > 0) {
  process.stderr.write(`Unformatted inline docs code:\n${changedBlocks.join("\n")}\n`);
  process.exit(1);
}

// One oxfmt run covers the example files and (after inline edits) the entry files.
const result = runOxfmt([
  check ? "--check" : "--write",
  "apps/docs/src/examples/cases",
  ...(check ? [] : [contentDirectory, "apps/docs/src/content/learn.ts"]),
]);
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(1);
}

console.log(
  check
    ? "Docs code blocks are formatted."
    : `Formatted docs code blocks${changedBlocks.length ? ` (${changedBlocks.length} inline)` : ""}.`,
);
