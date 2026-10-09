import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

// Same trick as format-docs-code.mjs: load the TypeScript content modules with Node's native type
// stripping, mapping "./x.js" specifiers to their .ts source, so no Vite is needed.
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

process.chdir(new URL("..", import.meta.url).pathname);

const content = "apps/docs/src/content";
const load = (file) => import(pathToFileURL(`${content}/${file}`).href);

const entries = new Map();
for (const file of readdirSync(`${content}/components`).sort()) {
  if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
  entries.set(file.replace(/\.ts$/, ""), (await load(`components/${file}`)).default);
}

const { groupMeta, groupOrder } = await load("group-order.ts");
const { learnDocs } = await load("learn.ts");
const { renderLlmsFullTxt, renderLlmsTxt, promptFile } = await load("llms.ts");

const groups = groupMeta.map((meta) => ({
  ...meta,
  components: groupOrder[meta.id].map((slug) => {
    const entry = entries.get(slug);
    if (!entry) throw new Error(`Missing component entry for ${slug}`);
    return entry;
  }),
}));
const exampleSource = (slug) => {
  const file = `apps/docs/src/examples/cases/${slug}.tsx`;
  return existsSync(file) ? readFileSync(file, "utf8").trimEnd() : undefined;
};

const input = { groups, learn: learnDocs, exampleSource };
const outputDirectory = "apps/docs/public";
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(`${outputDirectory}/llms.txt`, renderLlmsTxt(input));
writeFileSync(`${outputDirectory}/llms-full.txt`, renderLlmsFullTxt(input));
// The shipped @comp0/genui system prompt is served next to them so the links resolve.
copyFileSync(`packages/genui/${promptFile}`, `${outputDirectory}/${promptFile}`);
console.log(`Generated llms.txt and llms-full.txt for ${entries.size} components.`);
