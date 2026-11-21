import { parseSync } from "vite";
import { describe, expect, it } from "vitest";
import { componentEntries } from "./catalog.js";

// WCAG 1.3.3 Sensory Characteristics: instructions must not rely only on color, shape, position,
// or sound ("press the green button", "the icon on the right"). Every string in each component
// entry is checked, prose and code alike, and so is the copy each live example renders (JSX text
// and string literals outside class names and styles); code rarely trips the matcher, and when it
// does the allowlist says why.

const verbs = "click|tap|press|select|use|choose|pick";
const shapeOrColor = "red|green|blue|yellow|orange|purple|round|square|circle|triangle|gear";
const sensory = `${shapeOrColor}|left|right|top|bottom|above|below|upper|lower`;

/** An imperative followed within four words (in the same sentence) by a sensory word. */
const imperativeThenSensory = new RegExp(
  `\\b(?:${verbs})\\b(?:[^\\w.!?;:]+\\w+){0,4}?[^\\w.!?;:]+(?:${sensory})\\b`,
  "gi",
);
const sensoryThing = new RegExp(`\\bthe (?:${shapeOrColor}) (?:button|icon|one)\\b`, "gi");
const onTheSide = /\b(?:on|in|at) the (?:(?:upper|lower|top|bottom)[ -])?(?:left|right)\b/gi;
const youWillHear = /\byou will hear\b/gi;
const soundCue =
  /\b(?:after|at|for|hear|when you hear|until) (?:the|a) (?:beep|chime|sound|tone)\b/gi;

/** The phrases in `text` that lean on a sensory characteristic. */
function sensoryInstructions(text: string) {
  return [imperativeThenSensory, sensoryThing, onTheSide, youWillHear, soundCue].flatMap(
    (pattern) => [...text.matchAll(pattern)].map(([phrase]) => phrase),
  );
}

/**
 * Reviewed matches: each is a string that trips the matcher without leaning on a sensory
 * characteristic. Keyed by source (an entry's slug or an example file) and the exact phrase
 * matched, so a new match in the same source still fails.
 */
const allowed: { source: string; phrase: string; reason: string }[] = [
  {
    source: "popover",
    phrase: "pick a placement such as bottom",
    reason: "names a value of the placement prop, not where to find something on screen",
  },
  {
    source: "tag-picker",
    phrase: "use Left",
    reason: "Left and Right are the arrow keys, named with the writing direction they depend on",
  },
  {
    source: "code-editor.diagnostics.tsx",
    phrase: "choose a diagnostic or symbol below",
    reason: "names what to choose (the diagnostic and symbol buttons); below only adds where",
  },
];

/** Every string value in an entry, with the path that reaches it. */
function strings(value: unknown, path: string): { path: string; text: string }[] {
  if (typeof value === "string") return [{ path, text: value }];
  if (Array.isArray(value))
    return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => strings(item, `${path}.${key}`));
  }
  return [];
}

const exampleSources = import.meta.glob<string>("../examples/cases/*.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});

/** Attributes whose strings style or identify an element rather than render as copy. */
const nonCopyAttribute = /^(?:className|style|key|id|href|src)$/;

/** What an example renders as text: JSX text and string literals, minus imports and styling. */
function exampleCopy(file: string, source: string) {
  const copy: string[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    const { type, ...fields } = node as { type?: string } & Record<string, unknown>;
    if (type === "ImportDeclaration") return;
    if (type === "JSXAttribute") {
      const name = fields.name as { name?: string };
      if (nonCopyAttribute.test(name.name ?? "")) return;
    }
    if (type === "JSXText" || (type === "Literal" && typeof fields.value === "string")) {
      copy.push(String(fields.value).replace(/\s+/g, " ").trim());
    }
    if (type === "TemplateElement") {
      copy.push(String((fields.value as { cooked: string }).cooked));
    }
    Object.values(fields).forEach(visit);
  };
  visit(parseSync(file, source, { lang: "tsx" }).program);
  return copy.filter(Boolean);
}

/** Every checked string: entry fields by slug, then example copy by file. */
const checked = [
  ...[...componentEntries].flatMap(([slug, entry]) =>
    strings(entry, slug).map((item) => ({ source: slug, ...item })),
  ),
  ...Object.entries(exampleSources).flatMap(([path, source]) => {
    const file = path.slice(path.lastIndexOf("/") + 1);
    return exampleCopy(file, source).map((text) => ({ source: file, path: file, text }));
  }),
];

describe("sensory instruction matcher", () => {
  it.each([
    ["Click the red button to delete.", "Click the red"],
    ["Press the round icon to start.", "Press the round"],
    ["Select the option on the right.", "Select the option on the right"],
    ["Use the menu above to filter.", "Use the menu above"],
    ["Tap the button at the bottom.", "Tap the button at the bottom"],
    ["Save with the green one.", "the green one"],
    ["The settings are on the left.", "on the left"],
    ["When it finishes you will hear a chime.", "you will hear"],
    ["Pick the orange one.", "Pick the orange"],
    ["Press the purple button to continue.", "Press the purple"],
    ["Settings are in the upper right.", "in the upper right"],
    ["Find it at the lower-left of the screen.", "at the lower-left"],
    ["Click the gear icon to open settings.", "Click the gear"],
    ["Open the settings with the gear icon.", "the gear icon"],
    ["Speak after the beep.", "after the beep"],
    ["Release the key when you hear a chime.", "when you hear a chime"],
    ["Wait for the sound, then continue.", "for the sound"],
    ["Tap a circle, then the square.", "Tap a circle"],
  ])("flags %j", (text, phrase) => {
    expect(sensoryInstructions(text)).toContain(phrase);
  });

  it.each([
    "Press Enter to submit the form.",
    "Select an option from the list labelled Size.",
    "Use it for a small ordered set of categories.",
    "Click Save. The panel on top of the page closes.",
    "Use ArrowLeft and ArrowRight to move between tabs.",
    "Choose a color such as a deep reddish tone.",
    "Click it and then wait a while before the list moves to the bottom.",
    "Use lowercase letters only.",
    "The sound plays when a message arrives.",
    "Tap Sun or Rain, then Flower.",
  ])("does not flag %j", (text) => {
    expect(sensoryInstructions(text)).toEqual([]);
  });
});

describe("docs copy", () => {
  it("reads the copy examples render, not their class names or imports", () => {
    expect(
      exampleCopy(
        "case.tsx",
        'import { Button } from "@comp0/react";\nexport function Example() {\n  return <Button className="select-none left-0" aria-label={`Save ${"draft"}`}>\n    Tap the round   one\n  </Button>;\n}',
      ),
    ).toEqual(["Save ", "draft", "Tap the round one"]);
    expect(Object.keys(exampleSources).length, "The scan must find the examples").toBeGreaterThan(
      100,
    );
  });

  it("does not rely on color, shape, position, or sound alone", () => {
    const findings = checked.flatMap(({ source, path, text }) =>
      sensoryInstructions(text)
        .filter(
          (phrase) => !allowed.some((entry) => entry.source === source && entry.phrase === phrase),
        )
        .map((phrase) => `${path}: ${JSON.stringify(phrase)} in ${JSON.stringify(text)}`),
    );
    expect(findings).toEqual([]);
  });

  it("allowlists only phrases that still occur", () => {
    const stale = allowed.filter(
      ({ source, phrase }) =>
        !checked.some(
          (item) => item.source === source && sensoryInstructions(item.text).includes(phrase),
        ),
    );
    expect(stale).toEqual([]);
  });
});
