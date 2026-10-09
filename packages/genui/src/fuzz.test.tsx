import { appendFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessibleName, expectAccessibleNames } from "../test/accessible-names.js";
import { createRandom, generateProps, hostileExtras, modes, type Mode } from "../test/fuzz.js";
import { setup } from "../test/render.js";
import { expectSafeDom } from "../test/safe-dom.js";
import { catalog } from "./catalog/catalog.js";
import { type CatalogEntry } from "./catalog/types.js";
import { parsePartialJson } from "./json/parse.js";
import { GenUI } from "./render/GenUI.js";
import { validateResponse } from "./validate/validate.js";

/**
 * Schema-driven fuzzing. For every component, props are generated from its Zod schema in six
 * modes (valid, partial, wrong-typed, oversized, hostile, mixed) and rendered through the real
 * renderer, both whole and cut at random points as a stream. `FUZZ_SEED` and `FUZZ_ITERATIONS`
 * (per component, default 12) replay or deepen a run; a failure names both. `FUZZ_TRACE=<file>`
 * logs each case before it renders.
 */
const seed = Number(process.env.FUZZ_SEED ?? 20261009);
const iterations = Math.max(modes.length, Number(process.env.FUZZ_ITERATIONS ?? 12));

let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

function reported() {
  return [...consoleError.mock.calls, ...consoleWarn.mock.calls].map((call) =>
    call.map(String).join(" ").slice(0, 400),
  );
}

function hash(text: string) {
  let value = 2166136261;
  for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

function describeCase(entry: CatalogEntry, iteration: number, mode: Mode, node: unknown) {
  let json = "";
  try {
    json = JSON.stringify(node, (_key, value: unknown) =>
      typeof value === "number" && !Number.isFinite(value) ? String(value) : value,
    ).slice(0, 1200);
  } catch {
    json = "(unserializable)";
  }
  return `FUZZ_SEED=${seed} ${entry.name} iteration ${iteration} (${mode}): ${json}`;
}

const prototypeKeys = Object.getOwnPropertyNames(Object.prototype).sort();

describe("fuzzing the catalog", () => {
  it("covers every component with every mode", () => {
    expect(catalog.length).toBeGreaterThan(30);
    expect(iterations).toBeGreaterThanOrEqual(modes.length);
  });

  it.each(catalog.map((entry) => [entry.name, entry] as const))(
    "%s survives generated props",
    async (_name, entry) => {
      const preventNavigation = (event: Event) => event.preventDefault();
      document.body.addEventListener("click", preventNavigation);
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

      for (let iteration = 0; iteration < iterations; iteration += 1) {
        const mode = modes[iteration % modes.length]!;
        const random = createRandom(seed + hash(`${entry.name}:${iteration}`));
        const node = {
          ...hostileExtras(random),
          ...generateProps(entry, random, mode),
          type: entry.name,
        };
        const label = describeCase(entry, iteration, mode, node);
        const streaming = mode !== "valid" && random.chance(0.3);
        const errors: unknown[] = [];
        consoleError.mockClear();
        consoleWarn.mockClear();

        // FUZZ_TRACE=<file> logs each case before it renders, to find the one that hangs.
        if (process.env.FUZZ_TRACE) appendFileSync(process.env.FUZZ_TRACE, `${label}\n`);
        try {
          const { container, user, unmount } = setup(
            <GenUI
              response={node}
              streaming={streaming}
              onAction={() => {}}
              onError={(list) => errors.push(...list)}
            />,
          );

          expectSafeDom(container);
          const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);
          expect(
            ids.filter((id, index) => ids.indexOf(id) !== index),
            "duplicate ids",
          ).toEqual([]);
          // With valid props every name the schema requires is present in the output.
          if (mode === "valid") {
            // The hostile extras are the one thing a valid node may be reported for.
            expect(
              errors.filter((error) => (error as { code: string }).code !== "unknown-prop"),
              "validation errors",
            ).toEqual([]);
            expectAccessibleNames(container);
          }
          if (!streaming) {
            for (const button of [...container.querySelectorAll("button")].slice(0, 5)) {
              if (button.hasAttribute("disabled") || accessibleName(button) === "") continue;
              await user.click(button);
            }
            expectSafeDom(container);
          }
          const output = reported();
          if (output.length > 0) throw new Error(`console output: ${output.join(" | ")}`);
          unmount();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`${message.slice(0, 1200)}\n${label.slice(0, 1500)}`);
        }
      }

      document.body.removeEventListener("click", preventNavigation);
      expect(Object.getOwnPropertyNames(Object.prototype).sort()).toEqual(prototypeKeys);
      expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
    },
    120_000,
  );

  it.each(catalog.map((entry) => [entry.name, entry] as const))(
    "%s survives being streamed in at random cuts",
    (_name, entry) => {
      for (let iteration = 0; iteration < 4; iteration += 1) {
        const mode = modes[iteration % modes.length]!;
        const random = createRandom(seed + hash(`stream:${entry.name}:${iteration}`));
        const node = { type: entry.name, ...generateProps(entry, random, mode) };
        const text = JSON.stringify({ type: "Stack", children: [node] });
        const label = describeCase(entry, iteration, mode, node);
        consoleError.mockClear();
        consoleWarn.mockClear();

        try {
          const { container, rerender, unmount } = setup(<GenUI response="" streaming />);
          // Oversized documents are cut into at most about eighty prefixes.
          const most = Math.ceil(text.length / 80);
          for (let end = 0; end < text.length; end += Math.max(most, random.int(1, 40))) {
            rerender(<GenUI response={text.slice(0, end)} streaming />);
            expectSafeDom(container);
          }
          rerender(<GenUI response={text} />);
          expectSafeDom(container);
          const output = reported();
          if (output.length > 0) throw new Error(`console output: ${output.join(" | ")}`);
          unmount();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`${message.slice(0, 1200)}\n${label.slice(0, 1500)}`);
        }
      }
    },
    120_000,
  );
});

describe("fuzzing the parser and validator", () => {
  const seeds = [
    '{"type":"Stack","children":[{"type":"Form","name":"f","title":"F","children":[{"type":"Select","label":"L","name":"n","options":["a",{"value":"b","label":"B"}],"value":{"$bind":"x","initial":"a"}}]},{"type":"Output","label":"O","value":{"$expr":"x + 1"}}]}',
    '{"type":"Stack","children":[{"type":"Tabs","tabs":[{"label":"A","children":[{"type":"Text","text":"é😀"}]}]},{"type":"Table","caption":"C","columns":["A"],"rows":[[1],[true],[null]]}]}',
  ];
  const pieces = [
    "{",
    "}",
    "[",
    "]",
    '"',
    ":",
    ",",
    "\\",
    "\\u",
    "1e999",
    "-",
    "true",
    "nul",
    "\u0000",
    "😀",
    "$bind",
    "$expr",
    "__proto__",
    " ",
  ];

  it("never throws, whatever the text", () => {
    const random = createRandom(seed);
    for (let iteration = 0; iteration < 1500; iteration += 1) {
      let text = random.pick(seeds);
      for (let edits = random.int(1, 6); edits > 0; edits -= 1) {
        const at = random.int(0, text.length);
        const roll = random.next();
        if (roll < 0.4) text = text.slice(0, at) + random.pick(pieces) + text.slice(at);
        else if (roll < 0.7) text = text.slice(0, at) + text.slice(at + random.int(1, 8));
        else text = text.slice(0, at);
      }
      for (const complete of [true, false]) {
        const result = validateResponse(text, { complete });
        expect(result.errors.length).toBeLessThanOrEqual(51);
      }
      parsePartialJson(text, { final: true });
    }
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });

  it("renders mutated documents safely", () => {
    const random = createRandom(seed + 1);
    for (let iteration = 0; iteration < 40; iteration += 1) {
      let text = random.pick(seeds);
      for (let edits = random.int(1, 4); edits > 0; edits -= 1) {
        const at = random.int(0, text.length);
        text = text.slice(0, at) + random.pick(pieces) + text.slice(at);
      }
      const { container, unmount } = setup(
        <GenUI response={text} streaming={random.chance(0.5)} />,
      );
      expectSafeDom(container);
      unmount();
    }

    expect(reported()).toEqual([]);
  }, 60_000);
});
