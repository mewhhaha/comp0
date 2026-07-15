import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { components } from "../apps/docs/src/content/catalog.ts";
import { learnDocs } from "../apps/docs/src/content/learn.ts";

const check = process.argv.includes("--check");
const oxfmt =
  process.platform === "win32" ? "node_modules/.bin/oxfmt.cmd" : "node_modules/.bin/oxfmt";

function runOxfmt(args, input) {
  return spawnSync(oxfmt, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input,
  });
}

function formatSnippet(source, language, name) {
  if (language === "bash") return source;
  const extension = language === "css" ? "css" : "tsx";
  let result = runOxfmt([`--stdin-filepath=code-block.${extension}`], source);
  if (result.status !== 0 && extension === "tsx") {
    result = runOxfmt(
      ["--stdin-filepath=code-block.tsx"],
      `<>
${source}
</>`,
    );
  }
  if (result.status !== 0) {
    throw new Error(`oxfmt could not parse ${name}:\n${result.stderr.trim()}`);
  }
  return result.stdout.trimEnd();
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
    .replaceAll("\`", "\\\`")
    .replaceAll("${", "\\${")
    .replaceAll("\r", "\\r")
    .replaceAll("\n", "\\n")}\``;
}

function replaceCodeBlocks(path, blocks) {
  const original = readFileSync(path, "utf8");
  let next = original;
  const changes = [];
  const uniqueBlocks = new Map(blocks.map((block) => [block.source, block]));

  for (const block of uniqueBlocks.values()) {
    const formatted = formatSnippet(block.source, block.language, block.name);
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

const learnBlocks = learnDocs.flatMap((document) =>
  document.sections.flatMap((section) =>
    section.code
      ? [
          {
            name: `learn/${document.slug}/${section.id}`,
            source: section.code,
            language: section.language ?? "tsx",
          },
        ]
      : [],
  ),
);
const catalogBlocks = components.flatMap((component) =>
  component.steps.flatMap((step, index) =>
    step.code
      ? [
          {
            name: `components/${component.slug}/step-${index + 1}`,
            source: step.code,
            language: step.language ?? "tsx",
          },
        ]
      : [],
  ),
);

const changedBlocks = [
  ...replaceCodeBlocks("apps/docs/src/content/learn.ts", learnBlocks),
  ...replaceCodeBlocks("apps/docs/src/content/catalog.ts", catalogBlocks),
];
const exampleResult = runOxfmt([check ? "--check" : "--write", "apps/docs/src/examples/cases"]);
if (exampleResult.status !== 0) process.stderr.write(exampleResult.stderr || exampleResult.stdout);

if (check && changedBlocks.length > 0) {
  process.stderr.write(`Unformatted inline docs code:\n${changedBlocks.join("\n")}\n`);
}
if (exampleResult.status !== 0 || (check && changedBlocks.length > 0)) process.exit(1);

if (!check) {
  const contentResult = runOxfmt([
    "--write",
    "apps/docs/src/content/catalog.ts",
    "apps/docs/src/content/learn.ts",
  ]);
  if (contentResult.status !== 0) {
    process.stderr.write(contentResult.stderr || contentResult.stdout);
    process.exit(1);
  }
}

console.log(
  check
    ? "Docs code blocks are formatted."
    : `Formatted docs code blocks${changedBlocks.length ? ` (${changedBlocks.length} inline)` : ""}.`,
);
