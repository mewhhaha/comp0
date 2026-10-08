import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ComponentDoc } from "./types.js";

/**
 * Typechecks the hand-written prop tables against the real component types.
 *
 * For each documented part this generates a TypeScript file of type-level
 * assertions and runs tsgo over it:
 *
 * - unknown: a documented prop name is not a key of the component's props.
 * - undocumented: a prop the component declares itself (not an `as`, `ref`,
 *   `children`, or a DOM attribute of the element it renders) has no row.
 *
 * Own props are the live keys of the props type minus the keys of the intrinsic
 * element the part renders (read from its `ComponentProps<"tag">` declaration).
 * Provider roots (`RootProps`) forbid DOM props without `as`, so every live key is
 * their own. Parts whose element cannot be read from source fall back to the union
 * of every intrinsic element's keys, which can only under-report.
 */

export type PropFailure = {
  slug: string;
  part: string;
  kind: "unknown" | "undocumented" | "not-exported";
  names: string[];
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const reactSrc = join(root, "packages/react/src");

type SourceInfo = { tag: string | undefined; isRoot: boolean; generic: string | undefined };

function* walk(directory: string): Generator<string> {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) yield path;
  }
}

/** Maps each exported component name to what its props type says about the element it renders. */
function indexSources(): Map<string, SourceInfo> {
  const index = new Map<string, SourceInfo>();
  for (const file of walk(reactSrc)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)) {
      const name = match[1]!;
      const typeStart = source.indexOf(`export type ${name}Props`);
      const fnStart = match.index ?? 0;
      let declaration = "";
      if (typeStart >= 0) {
        const end = typeStart < fnStart ? fnStart : source.length;
        declaration = source.slice(typeStart, end);
      }
      const isRoot = /\bRootProps</.test(declaration);
      const tag = /ComponentProps(?:WithRef)?<\s*"(\w+)"/.exec(declaration)?.[1];
      // Link-like parts are generic over `as`; instantiate them with the default element.
      const generic = new RegExp(
        `^export\\s+function\\s+${name}<\\w+ extends ElementType = "(\\w+)"`,
        "m",
      ).exec(source)?.[1];
      index.set(name, { tag: tag ?? generic, isRoot, generic });
    }
  }
  return index;
}

/** The prop names a table row documents: `"value / defaultValue"` is two names. */
export function documentedNames(rowName: string): string[] {
  return (
    rowName
      .split("/")
      .map((part) => part.trim())
      // Prose rows such as "HTML input props" describe forwarded attributes, not one prop.
      .filter((part) => !/\s/.test(part))
      .map((part) => /^[A-Za-z_][\w-]*/.exec(part)?.[0])
      .filter((name): name is string => Boolean(name))
  );
}

const isFreeform = (name: string) => name.startsWith("data-") || name.startsWith("aria-");

const helpers = `import type * as api from "@comp0/react";
import type { ComponentProps, ElementType, JSX, JSXElementConstructor } from "react";

type Base<C extends JSXElementConstructor<any>> = Exclude<ComponentProps<C>, { as: ElementType }>;
type Live<P> = { [K in keyof P]-?: [Exclude<P[K], undefined>] extends [never] ? never : K }[keyof P];
type Keys<C extends JSXElementConstructor<any>> = Live<Base<C>>;
type AllDom = { [K in keyof JSX.IntrinsicElements]: keyof JSX.IntrinsicElements[K] }[keyof JSX.IntrinsicElements];
type Skip = "as" | "ref" | "children" | "key" | keyof JSX.IntrinsicElements;
type Own<C extends JSXElementConstructor<any>, Dom> = Exclude<Keys<C>, Dom | Skip>;
type Unknown<Doc extends string, K> = Exclude<Doc, K | \`data-\${string}\` | \`aria-\${string}\`>;
type Undocumented<Doc extends string, C extends JSXElementConstructor<any>, Dom> = Exclude<Own<C, Dom>, Doc>;
type Check<T> = [T] extends [never] ? true : { names: T };
`;

const literal = (names: string[]) =>
  names.length ? names.map((name) => JSON.stringify(name)).join(" | ") : "never";

type Probe = { slug: string; part: string; kind: "unknown" | "undocumented"; line: number };

export function checkDocsProps(
  components: readonly ComponentDoc[],
  options: { slugs?: readonly string[] } = {},
): PropFailure[] {
  const sources = indexSources();
  const failures: PropFailure[] = [];
  const lines = helpers.split("\n");
  const probes: Probe[] = [];
  let counter = 0;

  for (const component of components) {
    if (options.slugs && !options.slugs.includes(component.slug)) continue;
    for (const part of component.parts) {
      const documented = (part.props ?? [])
        .flatMap((row) => documentedNames(row.name))
        .filter((name) => !isFreeform(name) || name === "as");
      // "AreaChartPlot / AreaChartPoint" shares one table: a name must exist on at least one
      // of the components, and each component's own props must be documented.
      const names = part.name
        .split("/")
        .map((value) => value.trim())
        .filter((value) => /^[A-Z]\w*$/.test(value));
      if (names.length === 0) continue;
      const missing = names.filter((name) => !sources.has(name));
      for (const name of missing) {
        failures.push({ slug: component.slug, part: name, kind: "not-exported", names: [name] });
      }
      const found = names.filter((name) => sources.has(name));
      if (found.length === 0) continue;
      const id = counter++;
      const reference = (name: string) => {
        const generic = sources.get(name)!.generic;
        return generic ? `typeof api.${name}<"${generic}">` : `typeof api.${name}`;
      };
      const union = found.map((name) => `Keys<${reference(name)}>`).join(" | ");
      const doc = literal(documented);
      const label = found.join(" / ");
      lines.push(`// ${component.slug}: ${label}`);
      lines.push(`const u${id}: Check<Unknown<${doc}, ${union}>> = true;`);
      probes.push({ slug: component.slug, part: label, kind: "unknown", line: lines.length });
      for (const name of found) {
        const info = sources.get(name)!;
        let dom = "AllDom";
        if (info.isRoot) dom = "never";
        else if (info.tag) dom = `keyof JSX.IntrinsicElements[${JSON.stringify(info.tag)}]`;
        lines.push(
          `const o${id}_${name}: Check<Undocumented<${doc}, ${reference(name)}, ${dom}>> = true;`,
        );
        probes.push({ slug: component.slug, part: name, kind: "undocumented", line: lines.length });
      }
    }
  }

  if (probes.length === 0) return failures;

  const directory = join(root, "node_modules/.cache/comp0-docs-props");
  mkdirSync(directory, { recursive: true });
  const file = join(directory, "assertions.ts");
  writeFileSync(file, `${lines.join("\n")}\n`);
  writeFileSync(
    join(directory, "tsconfig.json"),
    JSON.stringify({
      extends: relative(directory, join(root, "tsconfig.base.json")),
      compilerOptions: {
        noEmit: true,
        noErrorTruncation: true,
        types: [],
        paths: {
          "@comp0/react": [relative(directory, join(reactSrc, "index.ts"))],
          "@comp0/core": [relative(directory, join(root, "packages/core/src/index.ts"))],
        },
      },
      files: ["assertions.ts"],
    }),
  );
  const result = spawnSync(
    join(root, "node_modules/.bin/tsgo"),
    ["-p", directory, "--pretty", "false"],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const output = `${result.stdout}${result.stderr}`;

  const byLine = new Map(probes.map((probe) => [probe.line, probe]));
  const grouped = new Map<string, PropFailure>();
  let sawAssertionError = false;
  const unrelated: string[] = [];
  for (const raw of output.split("\n")) {
    const match = /assertions\.ts\((\d+),\d+\): error TS\d+: (.*)$/.exec(raw);
    if (!match) continue;
    const probe = byLine.get(Number(match[1]));
    const names = /names: ([^;}]+(?: \| [^;}]+)*)/.exec(match[2]!)?.[1];
    if (!probe || !names) {
      unrelated.push(raw);
      continue;
    }
    sawAssertionError = true;
    const parsed = [...names.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
    const key = `${probe.slug}|${probe.part}|${probe.kind}`;
    grouped.set(key, { slug: probe.slug, part: probe.part, kind: probe.kind, names: parsed });
  }
  if (unrelated.length > 0 || (result.status !== 0 && !sawAssertionError)) {
    throw new Error(
      `tsgo could not check the generated prop assertions (${relative(root, file)}):\n${[...unrelated, result.status !== 0 && !sawAssertionError ? output : ""].filter(Boolean).slice(0, 20).join("\n")}`,
    );
  }
  failures.push(...grouped.values());
  return failures;
}

/** Formats failures grouped by slug so a family agent can see only its own pages. */
export function formatPropFailures(failures: readonly PropFailure[]): string {
  const bySlug = new Map<string, PropFailure[]>();
  for (const failure of failures) {
    bySlug.set(failure.slug, [...(bySlug.get(failure.slug) ?? []), failure]);
  }
  const advice = {
    unknown: "documented but not a prop of the component (rename or remove the row)",
    undocumented:
      "real prop with no row (add prop(...) to the part in apps/docs/src/content/components/<slug>.ts)",
    "not-exported": "part name is not an export of @comp0/react (fix the part name)",
  } as const;
  return [...bySlug.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(
      ([slug, items]) =>
        `${slug}\n${items.map((item) => `  ${item.part}: ${item.kind} ${item.names.join(", ")}  [${advice[item.kind]}]`).join("\n")}`,
    )
    .join("\n");
}
