import { descriptionOf, jsonSchemaOf, shapeEntries } from "../catalog/schema.js";
import { expressionFunctions } from "../expression/expression.js";
import { type Vocabulary } from "./spec.js";
import { type StateContract } from "./state.js";
import { validateJsx } from "./validate.js";

type Contract = { readonly vocabulary: Vocabulary; readonly state?: StateContract | undefined };

/** The model, server view and client root use the same vocabulary and state. */
export function composition<const T extends Contract>(contract: T) {
  const { vocabulary, state } = contract;
  return {
    ...contract,
    validate(source: string, options: { complete?: boolean } = {}) {
      return validateJsx(source, { vocabulary, state, ...options });
    },
    prompt() {
      const specs = vocabulary.specs;
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
      if (state) {
        lines.push("Declared state (only these names may be bound or read):");
        for (const entry of shapeEntries(state.shape)) {
          lines.push(
            `${entry.name}: ${JSON.stringify(jsonSchemaOf(entry.schema))}; initial ${JSON.stringify(state.initial[entry.name])}`,
          );
        }
        lines.push(
          'Use bind="name" only on components with a binding contract; the declared state supplies the bound prop. Omit that prop when binding. The state schema and binding kind must match.',
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
        if (item.children === "label") lines.push("Children: visible text naming the component.");
        else if (item.children === "text")
          lines.push("Children: text and scalar expressions only.");
        else if (item.children === "nodes")
          lines.push("Children: any allowed components and text.");
        else if (item.children)
          lines.push(
            `Children: only ${item.children.filter((name) => vocabulary.get(name)).join(", ") || "none"}; no text.`,
          );
        else lines.push("Children: none; use a self-closing tag.");
        if (item.parents) lines.push(`Parent: ${item.parents.join(" or ")}.`);
        if (item.identity)
          lines.push(
            `Identity: ${item.identity.prop} must be a fixed string, unique for this component inside ${item.identity.scope}.`,
          );
        if (item.identity?.matchesBoundValue)
          lines.push("Each item identity must be accepted by the bound state of its owner.");
        if (item.binding)
          lines.push(`Binding: bind supplies ${item.binding.prop} (${item.binding.kind}).`);
      }
      return lines.join("\n");
    },
  };
}
export type Composition = ReturnType<typeof composition<Contract>>;
