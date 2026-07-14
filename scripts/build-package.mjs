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
const compilerBailouts = new Map();

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
    const relativePath = path.relative(sourceDirectory, file);
    const bailoutMessages = result.errors
      .filter((error) => error.message.startsWith("[ReactCompiler]"))
      .map((error) => error.message);
    if (bailoutMessages.length > 0) compilerBailouts.set(relativePath, bailoutMessages);
    const outputPath = path.join(outputDirectory, relativePath.replace(/\.[jt]sx?$/, ".js"));
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, result.code);
  }),
);

const packageName = JSON.parse(await readFile(path.join(packageDirectory, "package.json"), "utf8")).name;
const bailoutManifestPath = path.join(packageDirectory, "react-compiler-bailouts.json");
let expectedBailouts;
try {
  expectedBailouts = JSON.parse(await readFile(bailoutManifestPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const currentBailouts = Object.fromEntries([...compilerBailouts].sort(([first], [second]) =>
  first.localeCompare(second),
));
if (expectedBailouts && JSON.stringify(currentBailouts) !== JSON.stringify(expectedBailouts)) {
  throw new Error(
    `React Compiler bailouts changed for ${packageName}. Review the change and update ${path.relative(
      packageDirectory,
      bailoutManifestPath,
    )}:\n${JSON.stringify(currentBailouts, null, 2)}`,
  );
}

console.log(
  `Built ${packageName}: ${files.length} files, ${compiledFiles} React-compiled, ${compilerBailouts.size} compiler bailouts.`,
);
