// The data facades' props, written with ArkType and precompiled into data.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";
import { computed, list } from "../catalog/schema.js";

const cell = type("string | number | boolean | null");

export const tableProps = {
  caption: type("string").describe("What the table shows; it names the table for screen readers."),
  columns: type("string[]").describe("Column headings, left to right."),
  rows: cell
    .array()
    .array()
    .describe("One array of cells per row, in column order. The first cell names the row."),
};

const datumProps = {
  label: type("string").describe("Category name."),
  value: type("number").describe("Number for the category."),
};

const pointProps = {
  x: type("number").describe("Position on the horizontal axis, such as a year or an index."),
  y: type("number").describe("Number at that position."),
};

const categoricalChartProps = () => ({
  title: type("string").describe("What the chart shows; it names the chart. Required."),
  data: list(datumProps, "The bars, each { label, value }."),
  "description?": type("string").describe("One sentence stating the main takeaway."),
  "categoryLabel?": type("string").describe('Axis label for the categories; "Category".'),
  "valueLabel?": type("string").describe('Axis label for the numbers; "Value".'),
  "unit?": type("string").describe('Text appended to numbers, such as "%" or " ms".'),
});

export const pieChartProps = {
  title: type("string").describe("What the chart shows; it names the chart. Required."),
  data: list(datumProps, "The slices, each { label, value } with value >= 0."),
  "description?": type("string").describe("One sentence stating the main takeaway."),
  "categoryLabel?": type("string").describe('Heading for the slice names; "Category".'),
  "valueLabel?": type("string").describe('Heading for the numbers; "Value".'),
  "unit?": type("string").describe('Text appended to numbers, such as "%" or " ms".'),
};

const seriesChartProps = () => ({
  title: type("string").describe("What the chart shows; it names the chart. Required."),
  data: list(pointProps, "The points, each { x, y }."),
  "description?": type("string").describe("One sentence stating the main takeaway."),
  "xLabel?": type("string").describe('Axis label for x; "X".'),
  "yLabel?": type("string").describe('Axis label for y; "Y".'),
  "unit?": type("string").describe('Text appended to y numbers, such as "%" or " ms".'),
});

export const meterProps = {
  label: type("string").describe("What is measured. Required."),
  value: computed(
    type("number"),
    'The current measurement, or an expression such as {"$expr": "used / total * 100"}.',
  ),
  "min?": type("number").describe("Lowest possible value; 0 by default."),
  "max?": type("number").describe("Highest possible value; 100 by default."),
  "low?": type("number").describe("Values below this are low."),
  "high?": type("number").describe("Values above this are high."),
  "optimum?": type("number").describe("The ideal value."),
};

export const progressBarProps = {
  label: type("string").describe("What is progressing. Required."),
  "value?": computed(
    type("number"),
    "Percent complete, 0 to 100, or an expression; omit when unknown.",
  ),
};

export const barChartProps = categoricalChartProps();
export const columnChartProps = categoricalChartProps();
export const lineChartProps = seriesChartProps();
export const areaChartProps = seriesChartProps();
