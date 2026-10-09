import { type z } from "zod";
import { catalog } from "../src/catalog/catalog.js";
import { defOf } from "../src/catalog/describe-schema.js";
import { markerOf } from "../src/catalog/schema.js";
import { type CatalogEntry } from "../src/catalog/types.js";

/** A small seeded generator (mulberry32), so a failing run can be replayed from its seed. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    chance: (probability: number) => next() < probability,
    pick: <TItem>(items: readonly TItem[]): TItem => items[Math.floor(next() * items.length)]!,
  };
}

export type Random = ReturnType<typeof createRandom>;

/** How hostile the generated values are. */
export type Mode = "valid" | "partial" | "wrong-type" | "oversized" | "hostile" | "mixed";

export const modes: readonly Mode[] = [
  "valid",
  "partial",
  "wrong-type",
  "oversized",
  "hostile",
  "mixed",
];

export const hostileStrings: readonly string[] = [
  "<script>alert(1)</script>",
  `<img src=x onerror="alert(1)">`,
  `'"><svg onload=alert(1)>`,
  "javascript:alert(1)",
  " java\tscript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "data:image/svg+xml,<svg onload=alert(1)>",
  "vbscript:msgbox(1)",
  "blob:https://evil.example/x",
  "file:///etc/passwd",
  "//evil.example/x",
  "\\\\evil.example\\x",
  "\u0000\u0001\u001f",
  "‮evil",
  "${7*7}",
  "{{constructor.constructor('alert(1)')()}}",
  "__proto__",
  "constructor",
  "toString",
  "hasOwnProperty",
  "../../../etc/passwd",
  "%s%s%s%n",
  "\n\n\n",
  "   ",
  "",
  "😀\ud83d",
  "https://example.com/" + "a".repeat(2000),
  "mailto:a@example.com?subject=<script>",
  "#" + "x".repeat(50),
];

export const hostileNumbers: readonly number[] = [
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  -0,
  0,
  1,
  -1,
  0.1,
  1e21,
  -1e21,
  1e308,
  -1e308,
  5e-324,
  2 ** 53,
  -(2 ** 53),
  999999999999,
  7,
];

/** Names a binding might use, sensible and not. */
const bindingNames: readonly string[] = [
  "seats",
  "x",
  "a1",
  "price",
  "_under",
  "not a name",
  "__proto__",
  "constructor",
  "toString",
  "1abc",
  "",
  "n".repeat(100),
];

/** Expressions a model might write, from fine to hostile. */
export const expressions: readonly string[] = [
  "seats * 12",
  "round(price * 1.2, 2)",
  "seats > 3 ? 'many' : 'few'",
  "'x' + seats",
  "min(seats, 10) + max(price, 1)",
  "1 +",
  "alert(1)",
  "constructor",
  "constructor.constructor('alert(1)')()",
  "seats.length",
  "seats / 0",
  "(".repeat(80) + "1" + ")".repeat(80),
  "1+".repeat(400) + "1",
  "pow(10, 400)",
  "'" + "a".repeat(600) + "'",
  "${7*7}",
  "<script>alert(1)</script>",
  "",
  "   ",
  "a ? b",
  "!!!seats",
  "- - - 1",
];

function generateExpression(random: Random, mode: Mode): unknown {
  if (mode === "valid") return undefined;
  const roll = random.next();
  if (roll < 0.15) return generateHostile(random);
  return { $expr: random.pick(expressions) };
}

const blockEntries = () => catalog;

/** A nested-component value: component objects, unknown ones, text, and junk. */
function generateNodes(random: Random, mode: Mode, depth: number): unknown[] {
  const count = depth > 2 ? random.int(0, 1) : random.int(0, 3);
  const items: unknown[] = [];
  for (let index = 0; index < count; index += 1) {
    // Valid mode only writes components that exist.
    const roll = mode === "valid" ? 0 : random.next();
    if (roll < 0.7) {
      const entry = random.pick(blockEntries());
      items.push({ type: entry.name, ...generateProps(entry, random, mode, depth + 1) });
    } else if (roll < 0.8) {
      items.push({
        type: random.pick(["Script", "Iframe", "Option", "Datum", "Nope", "constructor"]),
      });
    } else if (roll < 0.9) {
      items.push(generateHostile(random, depth));
    } else {
      items.push(null);
    }
  }
  return items;
}

function generateHostile(random: Random, depth = 0): unknown {
  const roll = random.next();
  if (roll < 0.3) return random.pick(hostileStrings);
  if (roll < 0.5) return random.pick(hostileNumbers);
  if (roll < 0.6) return random.chance(0.5);
  if (roll < 0.7) return null;
  if (roll < 0.8) return {};
  if (roll < 0.9) return depth > 6 ? [] : [generateHostile(random, depth + 1)];
  return random.chance(0.5)
    ? { $bind: random.pick(hostileStrings), initial: generateHostile(random, depth + 1) }
    : { $expr: random.pick(hostileStrings) };
}

function deeplyNested(random: Random): unknown {
  let value: unknown = random.pick(hostileStrings);
  for (let level = 0; level < random.int(20, 60); level += 1) value = [value];
  return value;
}

function oversizedString(random: Random): string {
  return random.pick(["a", "word ", "<b>", "é"]).repeat(random.int(300, 1500));
}

/** Generates a value for a Zod schema in the given mode. */
export function generateValue(schema: z.ZodType, random: Random, mode: Mode, depth = 0): unknown {
  const effective =
    mode === "mixed" ? random.pick(modes.filter((entry) => entry !== "mixed")) : mode;
  if (effective === "wrong-type" && random.chance(0.6)) return generateHostile(random, depth);
  if (effective === "hostile" && random.chance(0.35)) return generateHostile(random, depth);
  if (effective === "hostile" && random.chance(0.05)) return deeplyNested(random);
  const marker = markerOf(schema);
  if (marker?.kind === "nodes") return generateNodes(random, effective, depth);
  if (marker?.kind === "bindable" && random.chance(0.4)) {
    const name =
      effective === "valid" ? random.pick(bindingNames.slice(0, 5)) : random.pick(bindingNames);
    const binding: Record<string, unknown> = { $bind: name };
    if (random.chance(0.6)) binding.initial = generateValue(marker.inner, random, mode, depth + 1);
    return binding;
  }
  if (marker?.kind === "bindable") return generateValue(marker.inner, random, mode, depth);
  if (marker?.kind === "computed") {
    const expression = random.chance(0.4) ? generateExpression(random, effective) : undefined;
    return expression ?? generateValue(marker.inner, random, mode, depth);
  }
  if (marker?.kind === "url") {
    if (effective === "valid") {
      if (marker.url === "image") return random.pick(["/ok.png", "https://example.com/a.png"]);
      return random.pick(["/ok", "https://example.com/a", "#top", "mailto:a@b.c"]);
    }
    return random.pick([...hostileStrings, "/ok.png", "https://example.com/a"]);
  }

  const def = defOf(schema);
  switch (def.type) {
    case "optional":
    case "nullable":
    case "default":
    case "readonly":
      if (random.chance(effective === "partial" ? 0.5 : 0.2))
        return def.type === "nullable" ? null : undefined;
      return generateValue(def.innerType as z.ZodType, random, mode, depth);
    case "string": {
      if (effective === "oversized" && depth <= 3) return oversizedString(random);
      if (effective === "hostile") return random.pick(hostileStrings);
      const word = random.pick(["Alpha", "Beta", "Gamma", "Pro plan", "Seats", "42", "x"]);
      if (effective === "partial" && random.chance(0.4))
        return word.slice(0, random.int(0, word.length));
      return word;
    }
    case "number": {
      if (effective === "hostile" || effective === "oversized") return random.pick(hostileNumbers);
      return random.int(-5, 120);
    }
    case "boolean":
      return random.chance(0.5);
    case "null":
      return null;
    case "enum": {
      const values = Object.values(def.entries as Record<string, string>);
      if (effective === "hostile" && random.chance(0.5)) return random.pick(hostileStrings);
      return random.pick(values);
    }
    case "literal":
      return (def.values as unknown[])[0];
    case "lazy":
      return generateValue((def.getter as () => z.ZodType)(), random, mode, depth);
    case "unknown":
      return generateHostile(random, depth);
    case "union":
      return generateValue(random.pick(def.options as z.ZodType[]), random, mode, depth + 1);
    case "array": {
      if (effective === "partial" && random.chance(0.3)) return undefined;
      if (depth > 3) return [];
      let count = random.int(0, 6);
      if (effective === "oversized") count = depth > 1 ? random.int(0, 20) : random.int(60, 200);
      if (effective === "valid") count = random.int(1, 6);
      const items: unknown[] = [];
      for (let index = 0; index < count; index += 1) {
        const item = generateValue(def.element as z.ZodType, random, mode, depth + 1);
        // A half-written trailing item is the common shape of a stream.
        items.push(
          effective === "partial" && index === count - 1 && random.chance(0.4)
            ? partialOf(item)
            : item,
        );
      }
      return items;
    }
    case "object": {
      const shape = def.shape as Record<string, z.ZodType>;
      const props: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(shape)) {
        const value = generateValue(child, random, mode, depth + 1);
        if (value !== undefined) props[key] = value;
      }
      return props;
    }
    default:
      return generateHostile(random, depth);
  }
}

function partialOf(value: unknown): unknown {
  if (typeof value === "string") return value.slice(0, Math.floor(value.length / 2));
  if (Array.isArray(value)) return value.slice(0, Math.floor(value.length / 2));
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).slice(0, 1);
    return Object.fromEntries(entries);
  }
  return null;
}

/** The props of one component (without its type) in the given mode. */
export function generateProps(
  entry: CatalogEntry,
  random: Random,
  mode: Mode,
  depth = 0,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(entry.props.shape)) {
    const value = generateValue(child as z.ZodType, random, mode, depth + 1);
    if (value !== undefined) props[key] = value;
  }
  return props;
}

/** Props a hostile model adds to every component; none are declared in any schema. */
export function hostileExtras(random: Random): Record<string, unknown> {
  const extras: Record<string, unknown> = {
    dangerouslySetInnerHTML: { __html: `<img src="x" onerror="alert(1)">` },
    onClick: () => {
      throw new Error("model handler ran");
    },
    onChange: "alert(1)",
    style: { background: "url(javascript:alert(1))" },
    srcDoc: "<script>alert(1)</script>",
    className: "evil",
    id: "evil",
    href: "javascript:alert(1)",
    src: "javascript:alert(1)",
    "data-evil": "1",
    ref: () => {},
    key: "k",
    as: "script",
  };
  return Object.fromEntries(Object.entries(extras).filter(() => random.chance(0.5)));
}
