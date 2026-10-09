import { useId } from "react";
import { z } from "zod";
import {
  AreaChart,
  AreaChartPlot,
  BarChart,
  BarChartPlot,
  ChartDescription,
  ChartTable,
  ChartTitle,
  ColumnChart,
  ColumnChartPlot,
  Label,
  LineChart,
  LineChartPlot,
  Meter,
  PieChart,
  PieChartLegend,
  PieChartPlot,
  ProgressBar,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  TableRowHeader,
} from "@comp0/react";
import { useComputed } from "../bridge/state.js";
import { computed } from "../catalog/schema.js";
import { defineEntry, type CatalogProps } from "../catalog/types.js";
import {
  asCell,
  asDatum,
  asNumber,
  asRecords,
  asStrings,
  asText,
  maxItems,
  uniqueBy,
} from "../safe.js";

const cell = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const tableProps = z.object({
  caption: z.string().describe("What the table shows; it names the table for screen readers."),
  columns: z.array(z.string()).describe("Column headings, left to right."),
  rows: z
    .array(z.array(cell))
    .describe("One array of cells per row, in column order. The first cell names the row."),
});

export function TableFacade({ caption, columns, rows }: CatalogProps<typeof tableProps>) {
  const headings = asStrings(columns, 24);
  // A cell budget keeps a hostile table from locking the page: wide tables get fewer rows.
  const rowLimit = Math.min(maxItems, Math.floor(800 / Math.max(1, headings.length)));
  const body: unknown[][] = Array.isArray(rows)
    ? rows.filter((row) => Array.isArray(row)).slice(0, rowLimit)
    : [];
  if (headings.length === 0) return null;
  return (
    <Table data-slot="table">
      <TableCaption>{asText(caption)}</TableCaption>
      <TableHeader>
        <TableRow>
          {headings.map((heading, index) => (
            <TableColumn key={index}>{heading}</TableColumn>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {body.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {headings.map((_, columnIndex) => {
              const value = row[columnIndex];
              if (columnIndex === 0) {
                return <TableRowHeader key={columnIndex}>{asCell(value)}</TableRowHeader>;
              }
              return (
                <TableCell
                  key={columnIndex}
                  data-numeric={typeof value === "number" ? "" : undefined}
                >
                  {asCell(value)}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const datumProps = z.object({
  label: z.string().describe("Category name."),
  value: z.number().describe("Number for the category."),
});

const pointProps = z.object({
  x: z.number().describe("Position on the horizontal axis, such as a year or an index."),
  y: z.number().describe("Number at that position."),
});

type Datum = { label: string; value: number };
type Point = { x: number; y: number };

function categories(data: unknown, allowNegative: boolean): Datum[] {
  const items: Datum[] = [];
  for (const record of asRecords(data)) {
    const label = asText(record.label);
    const value = asDatum(record.value);
    if (label.trim() === "" || value === undefined) continue;
    if (!allowNegative && value < 0) continue;
    items.push({ label, value });
  }
  return uniqueBy(items, (item) => item.label);
}

function points(data: unknown): Point[] {
  const items: Point[] = [];
  for (const record of asRecords(data)) {
    const x = asDatum(record.x);
    const y = asDatum(record.y);
    if (x !== undefined && y !== undefined) items.push({ x, y });
  }
  // Lines need strictly increasing x.
  items.sort((a, b) => a.x - b.x);
  return uniqueBy(items, (item) => String(item.x));
}

/** Axis and column labels; a blank label is a warning in the chart, so it falls back. */
function labelOr(value: unknown, fallback: string) {
  const text = asText(value);
  return text.trim() === "" ? fallback : text;
}

function formatter(unit: unknown) {
  const suffix = asText(unit);
  return (value: number) => `${value.toLocaleString("en-US")}${suffix}`;
}

/** What a chart shows while it has no usable data: its title and an accessible note. */
function ChartEmpty({ title }: { title: unknown }) {
  return (
    <figure data-slot="chart-empty">
      <figcaption>{asText(title)}</figcaption>
      <p>No data to chart yet.</p>
    </figure>
  );
}

function chartDescription(description: unknown) {
  const text = asText(description);
  return text === "" ? null : <ChartDescription>{text}</ChartDescription>;
}

const categoricalChartProps = () =>
  z.object({
    title: z.string().describe("What the chart shows; it names the chart. Required."),
    data: z.array(datumProps).describe("The bars, each { label, value }."),
    description: z.string().optional().describe("One sentence stating the main takeaway."),
    categoryLabel: z.string().optional().describe('Axis label for the categories; "Category".'),
    valueLabel: z.string().optional().describe('Axis label for the numbers; "Value".'),
    unit: z.string().optional().describe('Text appended to numbers, such as "%" or " ms".'),
  });

export function BarChartFacade({
  title,
  data,
  description,
  categoryLabel,
  valueLabel,
  unit,
}: CatalogProps<ReturnType<typeof categoricalChartProps>>) {
  const values = categories(data, true);
  if (values.length === 0) return <ChartEmpty title={title} />;
  return (
    <BarChart
      values={values}
      categoryLabel={labelOr(categoryLabel, "Category")}
      valueLabel={labelOr(valueLabel, "Value")}
      formatValue={formatter(unit)}
    >
      <ChartTitle>{asText(title)}</ChartTitle>
      <BarChartPlot aria-label={`Bar chart: ${asText(title)}`} />
      {chartDescription(description)}
      <ChartTable />
    </BarChart>
  );
}

export function ColumnChartFacade({
  title,
  data,
  description,
  categoryLabel,
  valueLabel,
  unit,
}: CatalogProps<ReturnType<typeof categoricalChartProps>>) {
  const values = categories(data, true);
  if (values.length === 0) return <ChartEmpty title={title} />;
  return (
    <ColumnChart
      values={values}
      categoryLabel={labelOr(categoryLabel, "Category")}
      valueLabel={labelOr(valueLabel, "Value")}
      formatValue={formatter(unit)}
    >
      <ChartTitle>{asText(title)}</ChartTitle>
      <ColumnChartPlot aria-label={`Column chart: ${asText(title)}`} />
      {chartDescription(description)}
      <ChartTable />
    </ColumnChart>
  );
}

const pieChartProps = z.object({
  title: z.string().describe("What the chart shows; it names the chart. Required."),
  data: z.array(datumProps).describe("The slices, each { label, value } with value >= 0."),
  description: z.string().optional().describe("One sentence stating the main takeaway."),
  categoryLabel: z.string().optional().describe('Heading for the slice names; "Category".'),
  valueLabel: z.string().optional().describe('Heading for the numbers; "Value".'),
  unit: z.string().optional().describe('Text appended to numbers, such as "%" or " ms".'),
});

export function PieChartFacade({
  title,
  data,
  description,
  categoryLabel,
  valueLabel,
  unit,
}: CatalogProps<typeof pieChartProps>) {
  const values = categories(data, false);
  const total = values.reduce((sum, item) => sum + item.value, 0);
  if (values.length === 0 || total <= 0) return <ChartEmpty title={title} />;
  return (
    <PieChart
      values={values}
      categoryLabel={labelOr(categoryLabel, "Category")}
      valueLabel={labelOr(valueLabel, "Value")}
      formatValue={formatter(unit)}
    >
      <ChartTitle>{asText(title)}</ChartTitle>
      <PieChartPlot aria-label={`Pie chart: ${asText(title)}`} />
      <PieChartLegend />
      {chartDescription(description)}
      <ChartTable />
    </PieChart>
  );
}

const seriesChartProps = () =>
  z.object({
    title: z.string().describe("What the chart shows; it names the chart. Required."),
    data: z.array(pointProps).describe("The points, each { x, y }."),
    description: z.string().optional().describe("One sentence stating the main takeaway."),
    xLabel: z.string().optional().describe('Axis label for x; "X".'),
    yLabel: z.string().optional().describe('Axis label for y; "Y".'),
    unit: z.string().optional().describe('Text appended to y numbers, such as "%" or " ms".'),
  });

function formatX(value: number | Date) {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function LineChartFacade({
  title,
  data,
  description,
  xLabel,
  yLabel,
  unit,
}: CatalogProps<ReturnType<typeof seriesChartProps>>) {
  const values = points(data);
  if (values.length === 0) return <ChartEmpty title={title} />;
  return (
    <LineChart
      values={values}
      xLabel={labelOr(xLabel, "X")}
      yLabel={labelOr(yLabel, "Y")}
      formatX={formatX}
      formatY={formatter(unit)}
    >
      <ChartTitle>{asText(title)}</ChartTitle>
      <LineChartPlot aria-label={`Line chart: ${asText(title)}`} />
      {chartDescription(description)}
      <ChartTable />
    </LineChart>
  );
}

export function AreaChartFacade({
  title,
  data,
  description,
  xLabel,
  yLabel,
  unit,
}: CatalogProps<ReturnType<typeof seriesChartProps>>) {
  const values = points(data);
  if (values.length === 0) return <ChartEmpty title={title} />;
  return (
    <AreaChart
      values={values}
      xLabel={labelOr(xLabel, "X")}
      yLabel={labelOr(yLabel, "Y")}
      formatX={formatX}
      formatY={formatter(unit)}
    >
      <ChartTitle>{asText(title)}</ChartTitle>
      <AreaChartPlot aria-label={`Area chart: ${asText(title)}`} />
      {chartDescription(description)}
      <ChartTable />
    </AreaChart>
  );
}

const meterProps = z.object({
  label: z.string().describe("What is measured. Required."),
  value: computed(z.number()).describe(
    'The current measurement, or an expression such as {"$expr": "used / total * 100"}.',
  ),
  min: z.number().optional().describe("Lowest possible value; 0 by default."),
  max: z.number().optional().describe("Highest possible value; 100 by default."),
  low: z.number().optional().describe("Values below this are low."),
  high: z.number().optional().describe("Values above this are high."),
  optimum: z.number().optional().describe("The ideal value."),
});

export function MeterFacade({
  label,
  value,
  min,
  max,
  low,
  high,
  optimum,
}: CatalogProps<typeof meterProps>) {
  const labelId = useId();
  const lower = asNumber(min) ?? 0;
  const upper = Math.max(lower, asNumber(max) ?? 100);
  const current = asNumber(useComputed(value));
  return (
    <div data-slot="meter-field">
      <Label id={labelId}>{asText(label)}</Label>
      {current !== undefined && (
        <>
          <Meter
            aria-labelledby={labelId}
            value={Math.min(upper, Math.max(lower, current))}
            min={lower}
            max={upper}
            low={asNumber(low)}
            high={asNumber(high)}
            optimum={asNumber(optimum)}
          />
          <span data-slot="meter-field-value">{current}</span>
        </>
      )}
    </div>
  );
}

const progressBarProps = z.object({
  label: z.string().describe("What is progressing. Required."),
  value: computed(z.number())
    .optional()
    .describe("Percent complete, 0 to 100, or an expression; omit when unknown."),
});

export function ProgressBarFacade({ label, value }: CatalogProps<typeof progressBarProps>) {
  const labelId = useId();
  const percent = asNumber(useComputed(value));
  return (
    <div data-slot="progress-bar-field">
      <Label id={labelId}>{asText(label)}</Label>
      <ProgressBar
        aria-labelledby={labelId}
        value={percent === undefined ? undefined : Math.min(100, Math.max(0, percent))}
        max={100}
      />
      {percent === undefined ? null : <span data-slot="progress-bar-field-value">{percent}%</span>}
    </div>
  );
}

export const dataEntries = [
  defineEntry({
    name: "Table",
    group: "Data",
    description:
      "A table for comparing items across attributes. Requires caption, columns, and rows; the first column should name each row. Use it instead of a chart when exact values matter. Large tables are cut off (24 columns, 800 cells).",
    props: tableProps,
    component: TableFacade,
  }),
  defineEntry({
    name: "BarChart",
    group: "Data",
    description:
      "Horizontal bars comparing a number across categories, best for long labels or rankings. Requires title and data ({ label, value } objects); add a description with the takeaway. A data table is included for screen readers.",
    props: categoricalChartProps(),
    component: BarChartFacade,
  }),
  defineEntry({
    name: "ColumnChart",
    group: "Data",
    description:
      "Vertical columns comparing a number across a few short categories. Requires title and data ({ label, value } objects); add a description with the takeaway.",
    props: categoricalChartProps(),
    component: ColumnChartFacade,
  }),
  defineEntry({
    name: "LineChart",
    group: "Data",
    description:
      "A line showing how a number changes along an ordered axis such as time. Requires title and data ({ x, y } objects with increasing x); add a description with the takeaway.",
    props: seriesChartProps(),
    component: LineChartFacade,
  }),
  defineEntry({
    name: "AreaChart",
    group: "Data",
    description:
      "Like LineChart with the area below filled, for totals that accumulate. Requires title and data ({ x, y } objects with increasing x).",
    props: seriesChartProps(),
    component: AreaChartFacade,
  }),
  defineEntry({
    name: "PieChart",
    group: "Data",
    description:
      "Parts of a whole, for up to six slices that sum to a meaningful total. Requires title and data ({ label, value } objects with values >= 0). Prefer BarChart for more slices.",
    props: pieChartProps,
    component: PieChartFacade,
  }),
  defineEntry({
    name: "Meter",
    group: "Data",
    description:
      "A value within a known range, such as disk usage or a score. Requires label and value; min is 0 and max is 100 unless given. Use ProgressBar for task progress.",
    props: meterProps,
    component: MeterFacade,
  }),
  defineEntry({
    name: "ProgressBar",
    group: "Data",
    description:
      "Progress of a task from 0 to 100 percent. Requires label; omit value when the amount is unknown.",
    props: progressBarProps,
    component: ProgressBarFacade,
  }),
];
