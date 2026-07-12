import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { transform } from "oxc-transform";

const packageDirectory = process.cwd();
const sourceDirectory = path.join(packageDirectory, "src");
const outputDirectory = path.join(packageDirectory, "dist");

async function sourceFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(file)));
      continue;
    }
    if (!/\.[jt]sx?$/.test(entry.name) || /\.test\.[jt]sx?$/.test(entry.name)) continue;
    files.push(file);
  }

  return files;
}

const files = await sourceFiles(sourceDirectory);
let compiledFiles = 0;
let compilerBailouts = 0;

await Promise.all(
  files.map(async (file) => {
    const source = await readFile(file, "utf8");
    const result = await transform(file, source, {
      reactCompiler: { target: "19", panicThreshold: "none" },
      typescript: { onlyRemoveTypeImports: true },
      jsx: { runtime: "automatic", development: false },
    });

    const fatalErrors = result.errors.filter(
      (error) => error.severity === "Error" && !error.message.startsWith("[ReactCompiler]"),
    );
    if (fatalErrors.length > 0 || !result.code) {
      const messages = fatalErrors.map((error) => error.message).join("\n");
      throw new Error(`Failed to transform ${path.relative(packageDirectory, file)}\n${messages}`);
    }

    if (result.code.includes("react/compiler-runtime")) compiledFiles += 1;
    if (result.errors.some((error) => error.message.startsWith("[ReactCompiler]"))) {
      compilerBailouts += 1;
    }

    const relativePath = path.relative(sourceDirectory, file);
    const outputPath = path.join(outputDirectory, relativePath.replace(/\.[jt]sx?$/, ".js"));
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, result.code);
  }),
);

const packageName = JSON.parse(await readFile(path.join(packageDirectory, "package.json"), "utf8")).name;
console.log(
  `Built ${packageName}: ${files.length} files, ${compiledFiles} React-compiled, ${compilerBailouts} compiler bailouts.`,
);
