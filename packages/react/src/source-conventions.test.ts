import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
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

  it("keeps boolean data attributes presence-based", () => {
    const directBooleanDataAttributes = conventionSources.flatMap(({ relativePath, source }) =>
      [...source.matchAll(/\bdata-[\w-]+=\{(?:true|false)\}/g)].map(
        (match) => `${relativePath}: ${match[0]}`,
      ),
    );

    expect(directBooleanDataAttributes).toEqual([]);
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

  it("keeps collection item textValue out of public React props and docs", () => {
    const collectionsSource = readFileSync(
      resolve(root, "packages/react/src/collections.tsx"),
      "utf8",
    );
    const docsSources = sources.filter(({ relativePath }) => relativePath.startsWith("apps/docs/"));
    const docsTextValueReferences = docsSources.flatMap(({ relativePath, source }) =>
      [...source.matchAll(/\btextValue\b/g)].map((match) => `${relativePath}: ${match[0]}`),
    );
    const collectionItemPropBlocks = [
      ...collectionsSource.matchAll(
        /export type (?:ListBoxItemProps|MenuItemProps)\b[\s\S]*?^};/gm,
      ),
    ].map((match) => match[0]);

    expect(collectionItemPropBlocks).toHaveLength(2);
    expect(collectionItemPropBlocks.join("\n")).not.toContain("textValue");
    expect(docsTextValueReferences).toEqual([]);
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
});
