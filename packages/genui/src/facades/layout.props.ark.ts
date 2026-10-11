// The layout facades' props, written with ArkType and precompiled into layout.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";
import { bindable, computed, nodes, oneOf, url } from "../catalog/schema.js";
import { gaps, aligns, tones } from "./tokens.js";

export const stackProps = {
  "direction?": oneOf(["column", "row"], '"column" (default) stacks vertically.'),
  "gap?": oneOf(gaps, 'Space between children; "md" by default.'),
  "align?": oneOf(aligns, "Cross-axis alignment."),
  "wrap?": type("boolean").describe("Let a row wrap onto several lines."),
  children: nodes("Components to lay out, in order."),
};

export const gridProps = {
  "columns?": type("number").describe("Number of equal columns, 1 to 6; 2 by default."),
  "gap?": oneOf(gaps, 'Space between cells; "md" by default.'),
  children: nodes("Components to place in grid cells, in order."),
};

export const cardProps = {
  title: type("string").describe("Heading of the card; it also names the card for screen readers."),
  "description?": type("string").describe("One short supporting sentence under the title."),
  "tone?": oneOf(["default", "muted", "accent"], "Visual emphasis."),
  children: nodes("Content of the card."),
};

export const headingProps = {
  text: type("string").describe("The heading text."),
  "level?": type("number").describe("Heading level 1 to 6; 2 by default. Do not skip levels."),
};

export const textProps = {
  text: computed(
    type("string"),
    'Plain text. Markdown and HTML are shown literally. May be {"$expr": "..."} over bound names.',
  ),
  "tone?": oneOf(tones, 'Meaning of the text; "default" unless it matters.'),
  "size?": oneOf(["sm", "md", "lg"], 'Text size; "md" by default.'),
};

export const imageProps = {
  src: url("image", "http(s) or relative URL of the image. data: URLs are not rendered."),
  alt: type("string").describe(
    "Text alternative describing what the image shows. Required; never a filename.",
  ),
  "caption?": type("string").describe("Visible caption under the image."),
};

export const listProps = {
  items: bindable(type("string[]"), "One short text per item."),
  "ordered?": type("boolean").describe("Number the items; bulleted by default."),
};
