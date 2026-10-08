import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

function descendantFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) return descendantFiles(path);
    return [path];
  });
}

function sourceFiles(directory: string) {
  return descendantFiles(directory).filter((path) => /\.(ts|tsx)$/.test(path));
}

function readSources(paths: string[]) {
  return paths.map((path) => ({
    path,
    relativePath: relative(root, path),
    source: readFileSync(path, "utf8"),
  }));
}

function matchingLines(source: string, pattern: RegExp) {
  return source
    .split("\n")
    .flatMap((line, index) => (pattern.test(line) ? [`${index + 1}: ${line.trim()}`] : []));
}

describe("source conventions", () => {
  const sources = readSources([
    ...sourceFiles(resolve(root, "packages/react/src")),
    ...sourceFiles(resolve(root, "apps/docs/src")),
  ]);
  const conventionSources = sources.filter(
    ({ relativePath }) => relativePath !== "packages/react/src/source-conventions.test.ts",
  );

  it("keeps generated TypeScript artifacts out of package source and test directories", () => {
    const packagesRoot = resolve(root, "packages");
    const packageSourceDirectories = readdirSync(packagesRoot).flatMap((packageName) =>
      ["src", "test"]
        .map((directoryName) => resolve(packagesRoot, packageName, directoryName))
        .filter((path) => statSync(path, { throwIfNoEntry: false })?.isDirectory()),
    );
    const generatedArtifacts = packageSourceDirectories
      .flatMap((directory) => descendantFiles(directory))
      .map((path) => relative(root, path))
      .filter((path) => /(?:\.d\.ts(?:\.map)?|\.tsbuildinfo)$/.test(path));

    expect(generatedArtifacts).toEqual([]);
  });

  it("uses provider-backed user interactions in browser tests", () => {
    const browserTests = conventionSources.filter(({ relativePath }) =>
      relativePath.endsWith(".browser.test.tsx"),
    );
    const syntheticInteractionHelpers = browserTests.flatMap(({ relativePath, source }) =>
      matchingLines(source, /\b(?:fireClick|fireKeyDown)\b|@testing-library\/user-event/).map(
        (line) => `${relativePath}:${line}`,
      ),
    );

    expect(syntheticInteractionHelpers).toEqual([]);
  });

  it("keeps public React modules in family folders behind one root barrel", () => {
    const reactSourceRoot = resolve(root, "packages/react/src");
    const folders = readdirSync(reactSourceRoot).filter((entry) =>
      statSync(resolve(reactSourceRoot, entry)).isDirectory(),
    );
    const families = folders.filter((folder) => folder !== "internal").sort();
    const rootModules = readdirSync(reactSourceRoot).filter(
      (entry) =>
        statSync(resolve(reactSourceRoot, entry)).isFile() &&
        /\.(ts|tsx)$/.test(entry) &&
        !/\.test\.tsx?$/.test(entry),
    );
    const rootIndexLines = readFileSync(resolve(reactSourceRoot, "index.ts"), "utf8")
      .trim()
      .split("\n");

    expect(rootModules).toEqual(["index.ts"]);
    expect(rootIndexLines).toEqual(
      families.map((family) => `export * from "./${family}/index.js";`),
    );
    expect(statSync(resolve(reactSourceRoot, "internal/index.ts"), { throwIfNoEntry: false })).toBe(
      undefined,
    );

    const familyIndexProblems = families.flatMap((family) => {
      const indexPath = resolve(reactSourceRoot, family, "index.ts");
      const relativePath = relative(root, indexPath);
      const source = readFileSync(indexPath, "utf8");
      const implementations = matchingLines(source, /\bexport\s+(?:function|const)\s+/).map(
        (line) => `${relativePath}:${line} defines an implementation`,
      );
      const foreignSpecifiers = [...source.matchAll(/from\s+"([^"]+)"/g)]
        .map((match) => match[1]!)
        .filter(
          (specifier) =>
            !/^\.\/[\w-]+\.js$/.test(specifier) ||
            !["ts", "tsx"].some((extension) =>
              statSync(
                resolve(reactSourceRoot, family, specifier.replace(/\.js$/, `.${extension}`)),
                {
                  throwIfNoEntry: false,
                },
              ),
            ),
        )
        .map((specifier) => `${relativePath}: re-exports ${specifier} from outside the folder`);
      return [...implementations, ...foreignSpecifiers];
    });
    const internalStarExports = sourceFiles(reactSourceRoot)
      .filter((path) => !path.includes("/internal/"))
      .flatMap((path) =>
        matchingLines(readFileSync(path, "utf8"), /export\s+\*\s+from\s+"[^"]*internal\//).map(
          (line) => `${relative(root, path)}:${line}`,
        ),
      );
    const sharedImplementations = sourceFiles(reactSourceRoot)
      .filter((path) => path.endsWith("-shared.tsx"))
      .flatMap((path) =>
        matchingLines(
          readFileSync(path, "utf8"),
          /\bexport\s+(?:function|const)\s+[A-Z]\w*Impl\b/,
        ).map((line) => `${relative(root, path)}:${line}`),
      );
    const componentAliases = sourceFiles(reactSourceRoot).flatMap((path) =>
      matchingLines(readFileSync(path, "utf8"), /\bexport\s+\{\s+[A-Z]\w*Impl\s+as\s+[A-Z]\w*/).map(
        (line) => `${relative(root, path)}:${line}`,
      ),
    );

    expect(familyIndexProblems).toEqual([]);
    expect(internalStarExports).toEqual([]);
    expect(sharedImplementations).toEqual([]);
    expect(componentAliases).toEqual([]);
  });
});
