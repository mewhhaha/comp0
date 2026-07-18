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

function sourceForTernaryScan(source: string) {
  return source
    .replaceAll("?.", "__")
    .replaceAll("??", "__")
    .replace(/\b([\w$]+)\?:/g, "$1__:");
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

  it("keeps boolean data attributes presence-based", () => {
    const directBooleanDataAttributes = conventionSources.flatMap(({ relativePath, source }) =>
      [...source.matchAll(/\bdata-[\w-]+=\{(?:true|false)\}/g)].map(
        (match) => `${relativePath}: ${match[0]}`,
      ),
    );

    expect(directBooleanDataAttributes).toEqual([]);
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

  it("keeps removed compatibility aliases out of docs and the public barrel", () => {
    const publicBarrel = readFileSync(resolve(root, "packages/react/src/index.ts"), "utf8");
    const docsSources = sources.filter(({ relativePath }) => relativePath.startsWith("apps/docs/"));
    const aliasReferences = docsSources.flatMap(({ relativePath, source }) =>
      [...source.matchAll(/\b(?:ComboBox|ComboBoxOption)\b|<\/?ComboBox\b/g)]
        .filter((match) => match[0] !== "ComboBoxValue")
        .map((match) => `${relativePath}: ${match[0]}`),
    );

    expect(publicBarrel).not.toContain("./compat.js");
    expect(publicBarrel).not.toMatch(/export\s+\*\s+from\s+["']\.\/compat\.js["']/);
    expect(aliasReferences).toEqual([]);
  });

  it("keeps React component props as exported type aliases", () => {
    const exportedPropInterfaces = conventionSources.flatMap(({ relativePath, source }) =>
      matchingLines(source, /\bexport\s+interface\s+\w+Props\b/).map(
        (line) => `${relativePath}:${line}`,
      ),
    );

    expect(exportedPropInterfaces).toEqual([]);
  });

  it("keeps ternaries shallow and compact", () => {
    const nestedTernaries = conventionSources.flatMap(({ relativePath, source }) => {
      const normalized = sourceForTernaryScan(source);
      return matchingLines(normalized, /\?[^:\n]+:[^?\n]*\?|\s:\s+.*\n\s+\?/).map(
        (line) => `${relativePath}:${line}`,
      );
    });
    const longTernaries = conventionSources.flatMap(({ relativePath, source }) => {
      const lines = sourceForTernaryScan(source).split("\n");
      return lines.flatMap((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("?")) return [`${relativePath}:${index + 1}: ${trimmed}`];
        if (!trimmed.includes("? (")) return [];
        const closeLineOffset = lines
          .slice(index + 1, index + 6)
          .findIndex((nextLine) => nextLine.trim().startsWith(":") || nextLine.includes(") :"));
        if (closeLineOffset < 3) return [];
        return [`${relativePath}:${index + 1}: ${trimmed}`];
      });
    });

    expect(nestedTernaries).toEqual([]);
    expect(longTernaries).toEqual([]);
  });

  it("keeps class name composition inline", () => {
    const extractedClassNames = conventionSources.flatMap(({ relativePath, source }) =>
      matchingLines(
        source,
        /\b(?:const|let)\s+\w*(?:ClassName|ClassNames|Classes|Class)\b\s*=\s*(?:["'`]|\[[^\]]*["'`]|(?:clsx|cn|resolveClassName)\()/,
      ).map((line) => `${relativePath}:${line}`),
    );

    expect(extractedClassNames).toEqual([]);
  });

  it("keeps public React component modules as root barrels over individual component files", () => {
    const reactSourceRoot = resolve(root, "packages/react/src");
    const componentRoot = resolve(reactSourceRoot, "components");
    const rootBarrels = sourceFiles(reactSourceRoot).filter((path) => {
      const relativePath = relative(reactSourceRoot, path);
      return (
        !relativePath.includes("/") &&
        relativePath !== "shared.tsx" &&
        relativePath !== "source-conventions.test.ts"
      );
    });
    const componentBarrelExports = rootBarrels.flatMap((path) => {
      const relativePath = relative(root, path);
      const source = readFileSync(path, "utf8");
      const implementations = matchingLines(source, /\bexport\s+(?:function|const)\s+[A-Z]/).map(
        (line) => `${relativePath}:${line}`,
      );
      expect(implementations).toEqual([]);

      return [...source.matchAll(/export\s+\*\s+from\s+"\.\/components\/([A-Z][\w]*)\.js";/g)]
        .map((match) => match[1])
        .filter((name) => name !== undefined);
    });
    const missingComponentFiles = componentBarrelExports
      .filter((name) => !statSync(resolve(componentRoot, `${name}.tsx`), { throwIfNoEntry: false }))
      .map((name) => `packages/react/src/components/${name}.tsx`);
    const sharedImplementations = sourceFiles(componentRoot)
      .filter((path) => path.endsWith("-shared.tsx"))
      .flatMap((path) => {
        const relativePath = relative(root, path);
        return matchingLines(
          readFileSync(path, "utf8"),
          /\bexport\s+(?:function|const)\s+[A-Z]\w*Impl\b/,
        ).map((line) => `${relativePath}:${line}`);
      });
    const componentAliases = sourceFiles(componentRoot)
      .filter((path) => !path.endsWith("-shared.tsx"))
      .flatMap((path) => {
        const relativePath = relative(root, path);
        return matchingLines(
          readFileSync(path, "utf8"),
          /\bexport\s+\{\s+[A-Z]\w*Impl\s+as\s+[A-Z]\w*/,
        ).map((line) => `${relativePath}:${line}`);
      });

    expect(missingComponentFiles).toEqual([]);
    expect(sharedImplementations).toEqual([]);
    expect(componentAliases).toEqual([]);
  });
});
