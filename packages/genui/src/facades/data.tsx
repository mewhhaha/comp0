import { useId } from "react";
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
import { useBound, useComputed } from "../bridge/state.js";
import { type CatalogProps } from "../catalog/types.js";
import {
  tableProps,
  barChartProps,
  columnChartProps,
  lineChartProps,
  areaChartProps,
  pieChartProps,
  meterProps,
  progressBarProps,
} from "./data.props.js";
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

export function TableFacade({
  caption,
  columns,
  rows: boundRows,
}: CatalogProps<typeof tableProps>) {
  const rows = useBound(boundRows);
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

export function BarChartFacade({
  title,
  data: boundData,
  description,
  categoryLabel,
  valueLabel,
  unit,
}: CatalogProps<typeof barChartProps>) {
  const data = useBound(boundData);
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
  data: boundData,
  description,
  categoryLabel,
  valueLabel,
  unit,
}: CatalogProps<typeof columnChartProps>) {
  const data = useBound(boundData);
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

export function PieChartFacade({
  title,
  data: boundData,
  description,
  categoryLabel,
  valueLabel,
  unit,
}: CatalogProps<typeof pieChartProps>) {
  const data = useBound(boundData);
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

function formatX(value: number | Date) {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function LineChartFacade({
  title,
  data: boundData,
  description,
  xLabel,
  yLabel,
  unit,
}: CatalogProps<typeof lineChartProps>) {
  const data = useBound(boundData);
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
  data: boundData,
  description,
  xLabel,
  yLabel,
  unit,
}: CatalogProps<typeof areaChartProps>) {
  const data = useBound(boundData);
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

/** The facades that render the data components, by component name. */
export const dataComponents = {
  Table: TableFacade,
  BarChart: BarChartFacade,
  ColumnChart: ColumnChartFacade,
  LineChart: LineChartFacade,
  AreaChart: AreaChartFacade,
  PieChart: PieChartFacade,
  Meter: MeterFacade,
  ProgressBar: ProgressBarFacade,
};
