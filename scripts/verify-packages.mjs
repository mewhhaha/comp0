import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "comp0-packages-"));
const packageDirectory = join(temporaryDirectory, "packages");
const consumerDirectory = join(temporaryDirectory, "consumer");
const storeDirectory =
  process.env.COMP0_PNPM_STORE_DIR ??
  execFileSync("pnpm", ["store", "path"], { cwd: root, encoding: "utf8" }).trim();

function run(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: "pipe" });
}

mkdirSync(packageDirectory, { recursive: true });
mkdirSync(consumerDirectory, { recursive: true });
run("pnpm", ["--filter", "@comp0/core", "pack", "--pack-destination", packageDirectory]);
run("pnpm", ["--filter", "@comp0/react", "pack", "--pack-destination", packageDirectory]);

const archives = readdirSync(packageDirectory).filter((entry) => entry.endsWith(".tgz"));
const coreArchive = archives.find((entry) => entry.includes("comp0-core"));
const reactArchive = archives.find((entry) => entry.includes("comp0-react"));

if (!coreArchive || !reactArchive) {
  throw new Error(`Expected packed core and react archives, received: ${archives.join(", ")}`);
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
        react: "19.2.7",
        "react-dom": "19.2.7",
      },
      devDependencies: {
        "@types/react": "19.2.16",
        "@types/react-dom": "19.2.3",
      },
      pnpm: {
        overrides: {
          "@comp0/core": `file:${join(packageDirectory, coreArchive)}`,
        },
      },
    },
    null,
    2,
  ),
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
import {Popover, Select, SelectPopover, SelectOption, SelectTrigger} from "@comp0/react";

export function Consumer() {
  const [value] = useControllableState({defaultValue: "alpha"});
  return <Select defaultValue={value}><Popover><SelectTrigger>Open</SelectTrigger><SelectPopover><SelectOption value="alpha">Alpha</SelectOption></SelectPopover></Popover></Select>;
}
`,
);

run("pnpm", ["install", "--ignore-scripts", "--store-dir", storeDirectory], consumerDirectory);
run(resolve(root, "node_modules/.bin/tsgo"), ["-p", "tsconfig.json"], consumerDirectory);
run(process.execPath, ["runtime.mjs"], consumerDirectory);

console.log("Packed @comp0/core and @comp0/react passed runtime and type consumer checks.");
