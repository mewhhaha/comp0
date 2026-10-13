import { type ComponentType, type ReactNode } from "react";
import {
  descriptionOf,
  jsonSchemaOf,
  shapeEntries,
  type OutputOf,
  type PropShape,
} from "../catalog/schema.js";
import { expressionFunctions } from "../expression/expression.js";
import { type StateContract } from "./state.js";
import { validateJsx, type ValidateJsxOptions } from "./validate.js";

export type ComponentChildren = "text" | "nodes" | readonly string[];
export type ComponentBinding = { prop: string; kind: "string" | "number" | "boolean" | "strings" };

type SpecData<P extends PropShape> = {
  readonly name: string;
  readonly description: string;
  readonly props: P;
  readonly children?: ComponentChildren;
  readonly binding?: ComponentBinding;
};

/** The default type erases the renderer while retaining the server-safe contract. */
export type ComponentDefinition<P extends PropShape = PropShape> = SpecData<P> & {
  readonly component: string extends keyof P
    ? unknown
    : ComponentType<OutputOf<P> & { children?: ReactNode }>;
};

export type ComponentSpec<P extends PropShape = PropShape> = SpecData<P> & {
  implement(
    component: string extends keyof P
      ? never
      : ComponentType<OutputOf<P> & { children?: ReactNode }>,
  ): ComponentDefinition<P>;
};

/** Describes a JSX component without loading its implementation. */
export function spec<P extends PropShape>(
  name: string,
  options: Omit<SpecData<P>, "name">,
): ComponentSpec<P> {
  if (!/^[A-Z][A-Za-z0-9_]*$/.test(name)) throw new Error(`Invalid component name: ${name}`);
  if (name === "Update" || name === "Append")
    throw new Error(`${name} is reserved for edit operations`);
  const names = shapeEntries(options.props).map((entry) => entry.name);
  if (new Set(names).size !== names.length) throw new Error(`${name} has duplicate props`);
  if (names.includes("id") || names.includes("bind") || names.includes("children")) {
    throw new Error(`${name}: id, bind and children are composition props`);
  }
  if (options.binding && !names.includes(options.binding.prop)) {
    throw new Error(`${name}: unknown binding prop ${options.binding.prop}`);
  }
  jsonSchemaOf(options.props);
  const data: SpecData<P> = { name, description: options.description, props: options.props };
  if (options.children !== undefined) Object.assign(data, { children: options.children });
  if (options.binding !== undefined) Object.assign(data, { binding: options.binding });
  return {
    ...data,
    implement(component) {
      return { ...data, component } as ComponentDefinition<P>;
    },
  };
}

export type Vocabulary = {
  readonly specs: readonly (ComponentSpec | ComponentDefinition)[];
  only(...names: string[]): Vocabulary;
  prompt(options?: { state?: StateContract }): string;
  validate(
    source: string,
    options?: Omit<ValidateJsxOptions, "vocabulary">,
  ): ReturnType<typeof validateJsx>;
};

type VocabularyItem =
  | ComponentSpec
  | ComponentDefinition
  | Vocabulary
  | readonly (ComponentSpec | ComponentDefinition)[];

/** Combines component contracts; duplicate names are ambiguous programmer errors. */
export function vocabulary(...items: VocabularyItem[]): Vocabulary {
  const specs: (ComponentSpec | ComponentDefinition)[] = [];
  for (const item of items) {
    if (Array.isArray(item)) specs.push(...item);
    else if ("specs" in item) specs.push(...item.specs);
    else specs.push(item as ComponentSpec | ComponentDefinition);
  }
  const byName = new Map<string, ComponentSpec | ComponentDefinition>();
  for (const item of specs) {
    if (byName.has(item.name)) throw new Error(`Duplicate component: ${item.name}`);
    byName.set(item.name, item);
  }
  const api: Vocabulary = {
    specs: Object.freeze(specs),
    only(...names) {
      const selected = names.map((name) => {
        const item = byName.get(name);
        if (!item) throw new Error(`Unknown component: ${name}`);
        return item;
      });
      return vocabulary(selected);
    },
    prompt(options = {}) {
      const lines = [
        "Write only restricted JSX: one component tree, without Markdown fences or surrounding text.",
        `Allowed components: ${specs.map((item) => item.name).join(", ") || "none"}. No native HTML tags or other components.`,
        "Use quoted attributes for strings and braces for booleans, numbers, arrays, and plain data objects. Compose components with nested children; close every tag.",
        "This is data, not JavaScript: no imports, declarations, assignments, functions, event handlers, spread attributes, member access, or executable code.",
        "Brace expressions may read declared state names and use literals, + - * / %, comparisons, == !=, && || !, conditional expressions, parentheses, and only the functions below. No property access or unlisted functions.",
        `Expression functions: ${expressionFunctions.map((item) => item.summary).join("; ")}.`,
        'Name components you may change later with id="name": a unique identifier of letters, digits, underscores or hyphens, beginning with a letter or underscore, at most 64 characters. IDs are protocol metadata, never DOM props.',
        'An edit turn contains only top-level <Update id="name" prop="new value" /> and <Append to="name">new children</Append> operations. Update merges only supplied props into the named component; it preserves its children, component name, binding, and collection item value. Do not update name or bind.',
        "Append adds children after the named component's existing children, following that target's child contract. New children may declare IDs used by later operations in the same turn. Do not mix edits with a new component tree.",
        "Only a complete, valid edit turn applies; any error rejects every operation in that turn. Previous views and their shared root stay mounted, preserving state, focus, and existing children.",
      ];
      if (options.state) {
        lines.push("Declared state (only these names may be bound or read):");
        for (const entry of shapeEntries(options.state.shape)) {
          lines.push(
            `${entry.name}: ${JSON.stringify(jsonSchemaOf(entry.schema))}; initial ${JSON.stringify(options.state.initial[entry.name])}`,
          );
        }
        lines.push(
          'Use bind="name" only on components with a binding contract; the declared state supplies the bound prop. The state schema and binding kind must match.',
        );
      } else lines.push("No state is declared; do not use bind or read state names.");
      for (const item of specs) {
        lines.push(
          "",
          `<${item.name}>: ${item.description}`,
          `Props: ${JSON.stringify(jsonSchemaOf(item.props))}`,
        );
        for (const entry of shapeEntries(item.props)) {
          const description = descriptionOf(entry.schema);
          if (description) lines.push(`${entry.name}: ${description}`);
        }
        if (item.children === "text") lines.push("Children: text and scalar expressions only.");
        else if (item.children === "nodes")
          lines.push("Children: any allowed components and text.");
        else if (item.children)
          lines.push(
            `Children: only ${item.children.filter((name) => byName.has(name)).join(", ") || "none"}; no text.`,
          );
        else lines.push("Children: none; use a self-closing tag.");
        if (item.binding)
          lines.push(`Binding: bind supplies ${item.binding.prop} (${item.binding.kind}).`);
      }
      return lines.join("\n");
    },
    validate(source, options = {}) {
      return validateJsx(source, { ...options, vocabulary: api });
    },
  };
  return api;
}
