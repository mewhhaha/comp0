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
  comp0: JSON.parse(readFileSync(join(root, "package.json"), "utf8")),
  core: JSON.parse(readFileSync(join(root, "packages/core/package.json"), "utf8")),
  react: JSON.parse(readFileSync(join(root, "packages/react/package.json"), "utf8")),
};

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
  if (expectedDirectory) {
    assert(
      manifest.repository?.directory === expectedDirectory,
      `${packageName} must identify its repository directory.`,
    );
  } else {
    assert(
      manifest.repository?.directory === undefined,
      `${packageName} must identify the repository root as its source directory.`,
    );
  }
  assert(manifest.publishConfig?.access === "public", `${packageName} must publish publicly.`);
  assert(entries.includes("package/README.md"), `${packageName} tarball is missing README.md.`);
  assert(entries.includes("package/LICENSE"), `${packageName} tarball is missing LICENSE.`);

  if (!expectedDirectory) {
    assert(
      entries.every((entry) =>
        ["package/package.json", "package/README.md", "package/LICENSE"].includes(entry),
      ),
      `${packageName} tarball must contain only its manifest, README, and license.`,
    );
    return manifest;
  }

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
run("pnpm", ["pack", "--pack-destination", packageDirectory]);

const archives = readdirSync(packageDirectory).filter((entry) => entry.endsWith(".tgz"));
const coreArchive = archives.find((entry) => entry.includes("comp0-core"));
const reactArchive = archives.find((entry) => entry.includes("comp0-react"));
const comp0Archive = archives.find((entry) => /^comp0-\d/.test(entry));

if (!comp0Archive || !coreArchive || !reactArchive) {
  throw new Error(
    `Expected packed comp0, core, and react archives, received: ${archives.join(", ")}`,
  );
}

const coreArchivePath = join(packageDirectory, coreArchive);
const reactArchivePath = join(packageDirectory, reactArchive);
inspectArchive(join(packageDirectory, comp0Archive), packageSources.comp0);
const coreManifest = inspectArchive(coreArchivePath, packageSources.core, "packages/core");
const reactManifest = inspectArchive(reactArchivePath, packageSources.react, "packages/react");

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

writeFileSync(
  join(consumerDirectory, "package.json"),
  JSON.stringify(
    {
      private: true,
      type: "module",
      dependencies: {
        "@comp0/core": `file:${join(packageDirectory, coreArchive)}`,
        "@comp0/react": `file:${join(packageDirectory, reactArchive)}`,
        react: "19.2.7",
        "react-dom": "19.2.7",
        "react-router": "8.2.0",
      },
      devDependencies: {
        "@types/react": "19.2.17",
        "@types/react-dom": "19.2.3",
      },
    },
    null,
    2,
  ),
);

// pnpm 11 reads overrides from pnpm-workspace.yaml, not the package.json
// pnpm field; without this the react archive resolves @comp0/core from the
// registry before this release exists there. The packed manifest is inspected
// above before this local installation override is applied.
writeFileSync(
  join(consumerDirectory, "pnpm-workspace.yaml"),
  `overrides:\n  "@comp0/core": file:${join(packageDirectory, coreArchive)}\n`,
);

writeFileSync(
  join(consumerDirectory, "runtime.mjs"),
  `import * as core from "@comp0/core";
import * as react from "@comp0/react";

if (typeof core.useControllableState !== "function" || typeof react.Button !== "function") {
  throw new Error("Packed root exports are not executable.");
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

export function Consumer() {
  const [value] = useControllableState({defaultValue: "basic"});
  return <><Select as="div" defaultValue={value} name="plan"><Label>Plan</Label><SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger><SelectPopover><SelectOption value="basic">Basic</SelectOption></SelectPopover></Select><Comp0Link as={RouterLink} to="/settings">Settings</Comp0Link></>;
}
`,
);

run("pnpm", ["install", "--ignore-scripts", "--store-dir", storeDirectory], consumerDirectory);
run(resolve(root, "node_modules/.bin/tsgo"), ["-p", "tsconfig.json"], consumerDirectory);
run(process.execPath, ["runtime.mjs"], consumerDirectory);

console.log("Packed comp0, @comp0/core, and @comp0/react passed artifact and consumer checks.");
