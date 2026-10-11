// Generated from data.props.ark.ts by `pnpm test -u` (src/facades/props.test.ts). Do not edit:
// change the ArkType source and regenerate.
import { bindable, computed, fromJsonSchema, list } from "../catalog/schema.js";

export const tableProps = {
  caption: fromJsonSchema<string>({
    type: "string",
    description: "What the table shows; it names the table for screen readers.",
  }),
  columns: fromJsonSchema<string[]>({
    type: "array",
    description: "Column headings, left to right.",
    items: { type: "string" },
  }),
  rows: bindable(
    fromJsonSchema<(number | string | boolean | null)[][]>({
      type: "array",
      items: {
        type: "array",
        items: {
          anyOf: [{ type: "number" }, { type: "string" }, { type: "boolean" }, { type: "null" }],
        },
      },
    }),
    "One array of cells per row, in column order. The first cell names the row.",
  ),
};
export const pieChartProps = {
  title: fromJsonSchema<string>({
    type: "string",
    description: "What the chart shows; it names the chart. Required.",
  }),
  data: bindable(
    list({
      label: fromJsonSchema<string>({ type: "string", description: "Category name." }),
      value: fromJsonSchema<number>({ type: "number", description: "Number for the category." }),
    }),
    "The slices, each { label, value } with value >= 0.",
  ),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "One sentence stating the main takeaway.",
  }),
  "categoryLabel?": fromJsonSchema<string>({
    type: "string",
    description: 'Heading for the slice names; "Category".',
  }),
  "valueLabel?": fromJsonSchema<string>({
    type: "string",
    description: 'Heading for the numbers; "Value".',
  }),
  "unit?": fromJsonSchema<string>({
    type: "string",
    description: 'Text appended to numbers, such as "%" or " ms".',
  }),
};
export const meterProps = {
  label: fromJsonSchema<string>({ type: "string", description: "What is measured. Required." }),
  value: computed(
    fromJsonSchema<number>({ type: "number" }),
    'The current measurement, or an expression such as {"$expr": "used / total * 100"}.',
  ),
  "min?": fromJsonSchema<number>({
    type: "number",
    description: "Lowest possible value; 0 by default.",
  }),
  "max?": fromJsonSchema<number>({
    type: "number",
    description: "Highest possible value; 100 by default.",
  }),
  "low?": fromJsonSchema<number>({ type: "number", description: "Values below this are low." }),
  "high?": fromJsonSchema<number>({ type: "number", description: "Values above this are high." }),
  "optimum?": fromJsonSchema<number>({ type: "number", description: "The ideal value." }),
};
export const progressBarProps = {
  label: fromJsonSchema<string>({ type: "string", description: "What is progressing. Required." }),
  "value?": computed(
    fromJsonSchema<number>({ type: "number" }),
    "Percent complete, 0 to 100, or an expression; omit when unknown.",
  ),
};
export const barChartProps = {
  title: fromJsonSchema<string>({
    type: "string",
    description: "What the chart shows; it names the chart. Required.",
  }),
  data: bindable(
    list({
      label: fromJsonSchema<string>({ type: "string", description: "Category name." }),
      value: fromJsonSchema<number>({ type: "number", description: "Number for the category." }),
    }),
    "The bars, each { label, value }.",
  ),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "One sentence stating the main takeaway.",
  }),
  "categoryLabel?": fromJsonSchema<string>({
    type: "string",
    description: 'Axis label for the categories; "Category".',
  }),
  "valueLabel?": fromJsonSchema<string>({
    type: "string",
    description: 'Axis label for the numbers; "Value".',
  }),
  "unit?": fromJsonSchema<string>({
    type: "string",
    description: 'Text appended to numbers, such as "%" or " ms".',
  }),
};
export const columnChartProps = {
  title: fromJsonSchema<string>({
    type: "string",
    description: "What the chart shows; it names the chart. Required.",
  }),
  data: bindable(
    list({
      label: fromJsonSchema<string>({ type: "string", description: "Category name." }),
      value: fromJsonSchema<number>({ type: "number", description: "Number for the category." }),
    }),
    "The bars, each { label, value }.",
  ),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "One sentence stating the main takeaway.",
  }),
  "categoryLabel?": fromJsonSchema<string>({
    type: "string",
    description: 'Axis label for the categories; "Category".',
  }),
  "valueLabel?": fromJsonSchema<string>({
    type: "string",
    description: 'Axis label for the numbers; "Value".',
  }),
  "unit?": fromJsonSchema<string>({
    type: "string",
    description: 'Text appended to numbers, such as "%" or " ms".',
  }),
};
export const lineChartProps = {
  title: fromJsonSchema<string>({
    type: "string",
    description: "What the chart shows; it names the chart. Required.",
  }),
  data: bindable(
    list({
      x: fromJsonSchema<number>({
        type: "number",
        description: "Position on the horizontal axis, such as a year or an index.",
      }),
      y: fromJsonSchema<number>({ type: "number", description: "Number at that position." }),
    }),
    "The points, each { x, y }.",
  ),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "One sentence stating the main takeaway.",
  }),
  "xLabel?": fromJsonSchema<string>({ type: "string", description: 'Axis label for x; "X".' }),
  "yLabel?": fromJsonSchema<string>({ type: "string", description: 'Axis label for y; "Y".' }),
  "unit?": fromJsonSchema<string>({
    type: "string",
    description: 'Text appended to y numbers, such as "%" or " ms".',
  }),
};
export const areaChartProps = {
  title: fromJsonSchema<string>({
    type: "string",
    description: "What the chart shows; it names the chart. Required.",
  }),
  data: bindable(
    list({
      x: fromJsonSchema<number>({
        type: "number",
        description: "Position on the horizontal axis, such as a year or an index.",
      }),
      y: fromJsonSchema<number>({ type: "number", description: "Number at that position." }),
    }),
    "The points, each { x, y }.",
  ),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "One sentence stating the main takeaway.",
  }),
  "xLabel?": fromJsonSchema<string>({ type: "string", description: 'Axis label for x; "X".' }),
  "yLabel?": fromJsonSchema<string>({ type: "string", description: 'Axis label for y; "Y".' }),
  "unit?": fromJsonSchema<string>({
    type: "string",
    description: 'Text appended to y numbers, such as "%" or " ms".',
  }),
};
