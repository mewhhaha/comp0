// Writes genui.prompt.md from the built package. Run through `pnpm --filter @comp0/genui prompt`
// (the build runs it too), then commit the result: a test fails when the file is stale.
import { writeFile } from "node:fs/promises";
import { genuiPrompt } from "../dist/index.js";

const target = new URL("../genui.prompt.md", import.meta.url);
await writeFile(target, `${genuiPrompt()}\n`);
console.log("Wrote packages/genui/genui.prompt.md");
