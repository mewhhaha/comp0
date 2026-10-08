import type { ComponentDoc, ComponentPart, PartProp } from "./types.js";

export const p = (
  name: string,
  kind: ComponentPart["kind"],
  description: string,
  ownsDom = true,
  optional = false,
  props?: PartProp[],
): ComponentPart => ({ name, kind, description, ownsDom, optional: optional || undefined, props });

export const prop = (name: string, type: string, description: string): PartProp => ({
  name,
  type,
  description,
});

const imp = (names: string[]) => `import { ${names.join(", ")} } from "@comp0/react";`;

const formatExample = (source: string) => {
  const lines = source.replaceAll("><", ">\n<").split("\n");
  let depth = 0;
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("</")) depth -= 1;
      const formatted = `${"  ".repeat(depth + 2)}${trimmed}`;
      const opensNestedContent =
        trimmed.startsWith("<") &&
        !trimmed.startsWith("</") &&
        !trimmed.endsWith("/>") &&
        !trimmed.includes("</");
      if (opensNestedContent) depth += 1;
      return formatted;
    })
    .join("\n");
};

export type ComponentEntry = Omit<ComponentDoc, "steps" | "exampleSource"> & {
  /** The three fixed lesson steps; `code` illustrates the last one. */
  steps: {
    main: string;
    supporting: string;
    behavior: string;
    code: string;
  };
  /** JSX for the generated quick-start example; `imports` become its import line. */
  snippet: string;
};

/** Builds one component page from its entry file. */
export function component({
  slug,
  title,
  group,
  summary,
  analogy,
  whenToUse,
  steps,
  imports,
  snippet,
  parts,
  keyboard,
  stateHooks,
  form,
  accessibility,
  related,
  moreExamples,
}: ComponentEntry): ComponentDoc {
  return {
    slug,
    title,
    group,
    summary,
    analogy,
    whenToUse,
    steps: [
      { title: "Add the main part", explanation: steps.main },
      { title: "Add the supporting parts", explanation: steps.supporting },
      { title: "Make the behavior clear", explanation: steps.behavior, code: steps.code },
    ],
    imports,
    parts,
    exampleSource: `${imp(imports)}\n\nexport function Example() {\n  return (\n${formatExample(snippet)}\n  );\n}`,
    moreExamples,
    keyboard,
    stateHooks,
    form,
    accessibility,
    related,
  };
}
