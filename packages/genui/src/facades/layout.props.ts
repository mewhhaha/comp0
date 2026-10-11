// Generated from layout.props.ark.ts by `pnpm test -u` (src/facades/props.test.ts). Do not edit:
// change the ArkType source and regenerate.
import { bindable, computed, fromJsonSchema, nodes, oneOf, url } from "../catalog/schema.js";

export const stackProps = {
  children: nodes("Components to lay out, in order."),
  "direction?": oneOf(["column", "row"], '"column" (default) stacks vertically.'),
  "gap?": oneOf(["xs", "sm", "md", "lg", "xl"], 'Space between children; "md" by default.'),
  "align?": oneOf(["start", "center", "end", "stretch"], "Cross-axis alignment."),
  "wrap?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "Let a row wrap onto several lines.",
  }),
};
export const gridProps = {
  children: nodes("Components to place in grid cells, in order."),
  "columns?": fromJsonSchema<number>({
    type: "number",
    description: "Number of equal columns, 1 to 6; 2 by default.",
  }),
  "gap?": oneOf(["xs", "sm", "md", "lg", "xl"], 'Space between cells; "md" by default.'),
};
export const cardProps = {
  title: fromJsonSchema<string>({
    type: "string",
    description: "Heading of the card; it also names the card for screen readers.",
  }),
  children: nodes("Content of the card."),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "One short supporting sentence under the title.",
  }),
  "tone?": oneOf(["default", "muted", "accent"], "Visual emphasis."),
};
export const headingProps = {
  text: fromJsonSchema<string>({ type: "string", description: "The heading text." }),
  "level?": fromJsonSchema<number>({
    type: "number",
    description: "Heading level 1 to 6; 2 by default. Do not skip levels.",
  }),
};
export const textProps = {
  text: computed(
    fromJsonSchema<string>({ type: "string" }),
    'Plain text. Markdown and HTML are shown literally. May be {"$expr": "..."} over bound names.',
  ),
  "tone?": oneOf(
    ["default", "muted", "success", "warning", "danger"],
    'Meaning of the text; "default" unless it matters.',
  ),
  "size?": oneOf(["sm", "md", "lg"], 'Text size; "md" by default.'),
};
export const imageProps = {
  src: url("image", "http(s) or relative URL of the image. data: URLs are not rendered."),
  alt: fromJsonSchema<string>({
    type: "string",
    description: "Text alternative describing what the image shows. Required; never a filename.",
  }),
  "caption?": fromJsonSchema<string>({
    type: "string",
    description: "Visible caption under the image.",
  }),
};
export const listProps = {
  items: bindable(
    fromJsonSchema<string[]>({ type: "array", items: { type: "string" } }),
    "One short text per item.",
  ),
  "ordered?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "Number the items; bulleted by default.",
  }),
};
