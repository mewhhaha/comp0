// Rewrites packages/react/react-compiler-files.json from the built packages.
// Run through `pnpm compiler:baseline`, which builds first.
import { writeFile } from "node:fs/promises";
import { baselinePath, compiledDistFiles } from "./lib/compiler-coverage.mjs";

const files = await compiledDistFiles();
await writeFile(baselinePath, `${JSON.stringify(files, null, 2)}\n`);
console.log(
  `Wrote ${files.length} compiled files to ${baselinePath}. Review the diff before committing.`,
);
