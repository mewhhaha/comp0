import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "comp0-packages-"));
const packageDirectory = join(temporaryDirectory, "packages");
const consumerDirectory = join(temporaryDirectory, "consumer");
const storeDirectory =
  process.env.COMP0_PNPM_STORE_DIR ??
  execFileSync("pnpm", ["store", "path"], { cwd: root, encoding: "utf8" }).trim();
const packageSources = {
  core: JSON.parse(readFileSync(join(root, "packages/core/package.json"), "utf8")),
  react: JSON.parse(readFileSync(join(root, "packages/react/package.json"), "utf8")),
  genui: JSON.parse(readFileSync(join(root, "packages/genui/package.json"), "utf8")),
};
const workspaceManifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
// The consumer installs outside the workspace, so `catalog:` specs resolve to the
// versions pinned in pnpm-workspace.yaml's default catalog.
const catalog = Object.fromEntries(
  [
    ...(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8")
      .match(/^catalog:\n((?:[ \t]+.*\n?)*)/m)?.[1]
      .matchAll(/^\s+"?([^":\s]+)"?:\s*(\S+)\s*$/gm) ?? []),
  ].map(([, name, version]) => [name, version]),
);
function resolveSpec(name, spec) {
  if (spec !== "catalog:") return spec;
  const version = catalog[name];
  if (!version) throw new Error(`No catalog version for ${name} in pnpm-workspace.yaml.`);
  return version;
}
const docsManifest = JSON.parse(readFileSync(join(root, "apps/docs/package.json"), "utf8"));

function run(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: "pipe" });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readArchiveFile(archive, path) {
  return run("tar", ["-xOf", archive, `package/${path}`]);
}

function inspectArchive(archive, sourceManifest, expectedDirectory) {
  const entries = run("tar", ["-tzf", archive]).trim().split("\n");
  const manifest = JSON.parse(readArchiveFile(archive, "package.json"));
  const packageName = sourceManifest.name;

  assert(
    manifest.name === packageName,
    `Expected ${packageName} manifest, received ${manifest.name}.`,
  );
  assert(
    manifest.version === sourceManifest.version,
    `${packageName} must pack version ${sourceManifest.version}.`,
  );
  assert(manifest.license === "MIT", `${packageName} must pack with the MIT license.`);
  assert(typeof manifest.description === "string", `${packageName} must pack with a description.`);
  assert(
    ["accessibility", "headless", "react"].every((keyword) => manifest.keywords?.includes(keyword)),
    `${packageName} must pack with its public discovery keywords.`,
  );
  assert(
    manifest.homepage === "https://comp0-docs.horrible.workers.dev",
    `${packageName} must link to the Worker documentation.`,
  );
  assert(
    manifest.bugs?.url === "https://github.com/mewhhaha/comp0/issues",
    `${packageName} must link to the issue tracker.`,
  );
  assert(
    manifest.repository?.url === "git+https://github.com/mewhhaha/comp0.git",
    `${packageName} must link to the source repository.`,
  );
  assert(
    manifest.repository?.directory === expectedDirectory,
    `${packageName} must identify its repository directory.`,
  );
  assert(manifest.publishConfig?.access === "public", `${packageName} must publish publicly.`);
  assert(entries.includes("package/README.md"), `${packageName} tarball is missing README.md.`);
  assert(entries.includes("package/LICENSE"), `${packageName} tarball is missing LICENSE.`);
  assert(
    entries.includes("package/dist/index.js"),
    `${packageName} tarball is missing dist/index.js.`,
  );
  assert(
    entries.includes("package/dist/index.d.ts"),
    `${packageName} tarball is missing dist/index.d.ts.`,
  );
  assert(
    !entries.some((entry) => entry.endsWith(".d.ts.map") || entry.endsWith(".tsbuildinfo")),
    `${packageName} tarball must not contain declaration maps or build-info files.`,
  );

  return manifest;
}

mkdirSync(packageDirectory, { recursive: true });
mkdirSync(consumerDirectory, { recursive: true });
run("pnpm", ["--filter", "@comp0/core", "pack", "--pack-destination", packageDirectory]);
run("pnpm", ["--filter", "@comp0/react", "pack", "--pack-destination", packageDirectory]);
run("pnpm", ["--filter", "@comp0/genui", "pack", "--pack-destination", packageDirectory]);

const archives = readdirSync(packageDirectory).filter((entry) => entry.endsWith(".tgz"));
const coreArchive = archives.find((entry) => entry.includes("comp0-core"));
const reactArchive = archives.find((entry) => entry.includes("comp0-react"));
const genuiArchive = archives.find((entry) => entry.includes("comp0-genui"));

if (!coreArchive || !reactArchive || !genuiArchive) {
  throw new Error(
    `Expected packed core, react, and genui archives, received: ${archives.join(", ")}`,
  );
}

const coreArchivePath = join(packageDirectory, coreArchive);
const reactArchivePath = join(packageDirectory, reactArchive);
const coreManifest = inspectArchive(coreArchivePath, packageSources.core, "packages/core");
const reactManifest = inspectArchive(reactArchivePath, packageSources.react, "packages/react");
const genuiArchivePath = join(packageDirectory, genuiArchive);
const genuiManifest = inspectArchive(genuiArchivePath, packageSources.genui, "packages/genui");

assert(
  coreManifest.peerDependencies?.react === "^19.0.0",
  "@comp0/core must peer-depend on React 19.",
);
assert(
  coreManifest.peerDependencies?.["react-dom"] === undefined,
  "@comp0/core must not peer-depend on react-dom.",
);
assert(
  reactManifest.dependencies?.["@comp0/core"] === packageSources.core.version,
  `Packed @comp0/react must depend on @comp0/core ${packageSources.core.version}.`,
);
assert(
  reactManifest.peerDependencies?.react === "^19.0.0" &&
    reactManifest.peerDependencies?.["react-dom"] === "^19.0.0",
  "@comp0/react must peer-depend on React and React DOM 19.",
);

assert(
  genuiManifest.dependencies?.["@comp0/core"] === packageSources.core.version &&
    genuiManifest.dependencies?.["@comp0/react"] === packageSources.react.version,
  "Packed @comp0/genui must depend on the matching @comp0/core and @comp0/react versions.",
);
assert(
  genuiManifest.peerDependencies?.react === "^19.0.0" &&
    genuiManifest.peerDependencies?.["react-dom"] === "^19.0.0" &&
    genuiManifest.peerDependencies?.zod === "^4.0.0" &&
    Object.keys(genuiManifest.peerDependencies ?? {}).length === 3,
  "@comp0/genui must peer-depend on React 19, React DOM 19, and Zod 4 only.",
);
{
  const entries = run("tar", ["-tzf", genuiArchivePath]).trim().split("\n");
  assert(
    entries.includes("package/genui.prompt.md"),
    "@comp0/genui tarball is missing genui.prompt.md.",
  );
  assert(
    readArchiveFile(genuiArchivePath, "genui.prompt.md").includes("#### TextField"),
    "@comp0/genui genui.prompt.md must contain the generated component reference.",
  );
}

writeFileSync(
  join(consumerDirectory, "package.json"),
  JSON.stringify(
    {
      private: true,
      type: "module",
      dependencies: {
        "@comp0/core": `file:${join(packageDirectory, coreArchive)}`,
        "@comp0/react": `file:${join(packageDirectory, reactArchive)}`,
        "@comp0/genui": `file:${join(packageDirectory, genuiArchive)}`,
        react: resolveSpec("react", workspaceManifest.devDependencies.react),
        "react-dom": resolveSpec("react-dom", workspaceManifest.devDependencies["react-dom"]),
        "react-router": resolveSpec("react-router", docsManifest.dependencies["react-router"]),
        zod: resolveSpec("zod", packageSources.genui.devDependencies.zod),
      },
      devDependencies: {
        "@types/react": resolveSpec(
          "@types/react",
          workspaceManifest.devDependencies["@types/react"],
        ),
        "@types/react-dom": resolveSpec(
          "@types/react-dom",
          workspaceManifest.devDependencies["@types/react-dom"],
        ),
      },
    },
    null,
    2,
  ),
);

// pnpm reads overrides from pnpm-workspace.yaml, not the package.json
// pnpm field; without this the react archive resolves @comp0/core from the
// registry before this release exists there. The packed manifest is inspected
// above before this local installation override is applied.
writeFileSync(
  join(consumerDirectory, "pnpm-workspace.yaml"),
  [
    "overrides:",
    `  "@comp0/core": file:${join(packageDirectory, coreArchive)}`,
    `  "@comp0/react": file:${join(packageDirectory, reactArchive)}`,
    "",
  ].join("\n"),
);

writeFileSync(
  join(consumerDirectory, "runtime.mjs"),
  `import * as core from "@comp0/core";
import * as react from "@comp0/react";

if (typeof core.useControllableState !== "function" || typeof react.Button !== "function") {
  throw new Error("Packed root exports are not executable.");
}

const genui = await import("@comp0/genui");
if (typeof genui.GenUI !== "function" || genui.catalog.length === 0) {
  throw new Error("Packed @comp0/genui root exports are not executable.");
}
if (!Object.hasOwn(genui.responseJsonSchema().$defs ?? {}, "TextField")) {
  throw new Error("Packed @comp0/genui schema is missing its components.");
}
if (!Object.hasOwn(genui.responseJsonSchema({ strict: true }).$defs ?? {}, "Stack")) {
  throw new Error("Packed @comp0/genui strict schema is missing its components.");
}
if (!genui.genuiPrompt().includes("#### TextField")) {
  throw new Error("Packed @comp0/genui prompt is missing its components.");
}
if (genui.evaluateExpression("round(seats * 1.5, 2)", { seats: 3 }) !== 4.5) {
  throw new Error("Packed @comp0/genui expressions do not evaluate.");
}
const { createElement } = await import("react");
const { renderToString } = await import("react-dom/server");
const html = renderToString(
  createElement(genui.GenUI, {
    response: '{"type": "Stack", "children": [{"type": "Heading", "text": "Hello"}, {"type": "TextField", "label": "Email", "name": "email"}',
    streaming: true,
  }),
);
if (!html.includes("aria-busy") || !html.includes("Hello") || !html.includes("Email")) {
  throw new Error("Packed @comp0/genui did not render a streaming response: " + html);
}

try {
  await import("@comp0/react/button");
  throw new Error("Undeclared React component subpaths must not resolve.");
} catch (error) {
  if (error instanceof Error && error.message.includes("must not resolve")) throw error;
}
`,
);

writeFileSync(
  join(consumerDirectory, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        jsx: "react-jsx",
        module: "nodenext",
        moduleResolution: "nodenext",
        noEmit: true,
        strict: true,
        target: "es2022",
      },
      include: ["consumer.tsx"],
    },
    null,
    2,
  ),
);

writeFileSync(
  join(consumerDirectory, "consumer.tsx"),
  `import {useControllableState} from "@comp0/core";
import {Label, Link as Comp0Link, Select, SelectPopover, SelectOption, SelectTrigger, SelectValue} from "@comp0/react";
import {Link as RouterLink} from "react-router";
import {GenUI, catalog, describeFormValues, formatErrors, genuiPrompt, responseJsonSchema, type CatalogEntry, type GenUIAction} from "@comp0/genui";

const entries: readonly CatalogEntry[] = catalog;
const summary: string = describeFormValues([{ name: "plan", label: "Plan" }], { plan: "Pro" });
const system: string = genuiPrompt({ catalog: entries });
const schema = responseJsonSchema({ strict: true });

export function Assistant({ response, streaming }: { response: string; streaming: boolean }) {
  return <GenUI response={response} streaming={streaming} catalog={entries} onAction={(action: GenUIAction) => action.message + summary + system + String(schema)} onError={(errors) => formatErrors(errors)} />;
}

export function Consumer() {
  const [value] = useControllableState({defaultValue: "basic"});
  return <><Select as="div" defaultValue={value} name="plan"><Label>Plan</Label><SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger><SelectPopover><SelectOption value="basic">Basic</SelectOption></SelectPopover></Select><Comp0Link as={RouterLink} to="/settings">Settings</Comp0Link></>;
}
`,
);

run("pnpm", ["install", "--ignore-scripts", "--store-dir", storeDirectory], consumerDirectory);
run(resolve(root, "node_modules/.bin/tsgo"), ["-p", "tsconfig.json"], consumerDirectory);
run(process.execPath, ["runtime.mjs"], consumerDirectory);

console.log(
  "Packed @comp0/core, @comp0/react, and @comp0/genui passed artifact and consumer checks.",
);
