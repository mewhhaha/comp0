import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { components } from "./catalog.js";

// Limit the scan while fixing a family: DATA_ATTR_FAMILIES=select,menu pnpm exec vitest run --project unit apps/docs/src/content/data-attributes.test.ts
const only = process.env.DATA_ATTR_FAMILIES?.split(",").filter(Boolean);

const root = resolve(import.meta.dirname, "../../../..");
const reactSrc = join(root, "packages/react/src");

const vocabulary: Record<string, string | string[]> = JSON.parse(
  readFileSync(join(root, "packages/react/data-attributes.json"), "utf8"),
);

const globalVocabulary = new Set(
  Object.entries(vocabulary).flatMap(([key, value]) =>
    key === "$comment" ? [] : (value as string[]),
  ),
);

const documented = (slug: string) =>
  new Set(
    (components.find((component) => component.slug === slug)?.stateHooks ?? []).flatMap(
      (hook) => hook.attribute.match(/data-[a-z0-9-]+/g) ?? [],
    ),
  );

/** Family folders with no docs entry of their own are shared plumbing; they may use anything any page documents. */
function allowedFor(family: string) {
  const own = components.find((component) => component.slug === family);
  if (own) return documented(family);
  return new Set(components.flatMap((component) => [...documented(component.slug)]));
}

function stripComments(source: string) {
  // Keep line numbers stable by replacing comment text with spaces.
  return source.replace(/\/\*[\s\S]*?\*\/|(?<![:"'`\w])\/\/[^\n]*/g, (match) =>
    match.replace(/[^\n]/g, " "),
  );
}

/** `data-x=` JSX attributes and `"data-x":` object keys; selectors and prose do not count as emitting. */
export function emittedDataAttributes(source: string) {
  const code = stripComments(source);
  const found: { name: string; line: number }[] = [];
  const pattern =
    /(?<![\w[-])(data-[a-z][a-z0-9-]*)(?=\s*=[^=])|["'](data-[a-z][a-z0-9-]*)["']\s*:/g;
  for (const match of code.matchAll(pattern)) {
    const name = (match[1] ?? match[2])!;
    const line = code.slice(0, match.index).split("\n").length;
    found.push({ name, line });
  }
  return found;
}

describe("data attribute contract", () => {
  it("finds emitted attributes but not selectors or comments", () => {
    const source = [
      "// data-commented={1}",
      '<div data-slot="x" data-open={dataAttr(o)} />',
      'const style = { "data-state": 1 };',
      'el.closest("[data-popover-root]");',
    ].join("\n");
    expect(emittedDataAttributes(source)).toEqual([
      { name: "data-slot", line: 2 },
      { name: "data-open", line: 2 },
      { name: "data-state", line: 3 },
    ]);
  });

  it("emits only vocabulary attributes or ones documented in the family's stateHooks", () => {
    const violations: string[] = [];
    const families = readdirSync(reactSrc, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((family) => !only || only.includes(family))
      .sort();
    for (const family of families) {
      const allowed = allowedFor(family);
      const lines: string[] = [];
      const files = readdirSync(join(reactSrc, family), { recursive: true, withFileTypes: true });
      for (const entry of files) {
        if (!entry.isFile() || !/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name))
          continue;
        const path = join(entry.parentPath, entry.name);
        const source = readFileSync(path, "utf8");
        for (const { name, line } of emittedDataAttributes(source)) {
          if (globalVocabulary.has(name) || allowed.has(name)) continue;
          lines.push(`  ${path.slice(root.length + 1)}:${line} ${name}`);
        }
      }
      if (lines.length === 0) continue;
      const hasEntry = components.some((component) => component.slug === family);
      const advice = hasEntry
        ? `document it in apps/docs/src/content/components/${family}.ts stateHooks, or use a global attribute (packages/react/data-attributes.json)`
        : "shared folder with no docs entry: document it on the page that renders it, or use a global attribute";
      violations.push(`${family}  [${advice}]\n${[...new Set(lines)].join("\n")}`);
    }
    expect(violations.length, `\n${violations.join("\n")}\n`).toBe(0);
  });
});
