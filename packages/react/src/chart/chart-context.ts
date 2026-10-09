import { type Warn } from "../internal/dev.js";
import {
  type BoxPlotChartValue,
  type CandlestickChartValue,
  type CartesianChartValue,
  type CategoricalChartValue,
  type ChartContextValue,
  type DumbbellChartValue,
  type HeatmapChartValue,
  type MapChartValue,
  numberOf,
  type OpenToCloseChartValue,
  type SankeyChartLinkValue,
  type SankeyChartNodeValue,
  type ScatterChartValue,
  type StackedChartValue,
} from "./chart-shared.js";

/*
 * Every chart root turns its props into a ChartContextValue here. Malformed data never throws:
 * an invalid label falls back to a default, an invalid entry is skipped, and each problem warns
 * once in development. Production renders the same fallback.
 */

type Formatter<TValue> = ((value: TValue) => string) | undefined;

/** Returns `label`, or `fallback` after a development warning when it is blank. */
export function labelOr(
  warn: Warn,
  chartName: string,
  name: string,
  label: string,
  fallback: string,
) {
  if (label.trim()) return label;
  warn(`${chartName}:${name}-label`, `${chartName} ${name} label must not be empty.`);
  return fallback;
}

function skipped(warn: Warn, chartName: string, key: string, message: string) {
  warn(`${chartName}:${key}`, `${chartName} ${message} It was skipped.`);
}

function sameOrderedLabels(first: readonly string[], second: readonly string[]) {
  return first.length === second.length && first.every((label, index) => label === second[index]);
}

function validCategoricalValues(
  warn: Warn,
  chartName: string,
  values: readonly CategoricalChartValue[],
) {
  const valid: CategoricalChartValue[] = [];
  for (const [index, value] of values.entries()) {
    if (!value.label.trim()) {
      warn(
        `${chartName}:empty-label:${index}`,
        `${chartName} value at index ${index} has an empty label and was skipped.`,
      );
      continue;
    }
    if (!Number.isFinite(value.value)) {
      warn(
        `${chartName}:non-finite:${value.label}`,
        `${chartName} value "${value.label}" must be finite; received ${value.value}. It was skipped.`,
      );
      continue;
    }
    valid.push(value);
  }
  return valid;
}

export function categoricalChartContext(
  warn: Warn,
  chartName: string,
  kind: "bar" | "column" | "lollipop",
  values: readonly CategoricalChartValue[],
  categoryLabel: string,
  valueLabel: string,
  formatY: Formatter<number>,
): ChartContextValue {
  const safeCategoryLabel = labelOr(warn, chartName, "category", categoryLabel, "Category");
  const safeValueLabel = labelOr(warn, chartName, "value", valueLabel, "Value");
  return {
    kind,
    values: validCategoricalValues(warn, chartName, values),
    categoryLabel: safeCategoryLabel,
    valueLabel: safeValueLabel,
    formatY: formatY ?? String,
  };
}

/** Pie slices are parts of a whole: negative values are skipped and a non-positive total renders no slices. */
export function pieChartContext(
  warn: Warn,
  values: readonly CategoricalChartValue[],
  categoryLabel: string,
  valueLabel: string,
  formatY: Formatter<number>,
): ChartContextValue {
  const safeCategoryLabel = labelOr(warn, "PieChart", "category", categoryLabel, "Category");
  const safeValueLabel = labelOr(warn, "PieChart", "value", valueLabel, "Value");
  const slices = validCategoricalValues(warn, "PieChart", values).filter((value) => {
    if (value.value >= 0) return true;
    skipped(
      warn,
      "PieChart",
      `negative:${value.label}`,
      `value "${value.label}" must not be negative; received ${value.value}.`,
    );
    return false;
  });
  const total = slices.reduce((sum, value) => sum + value.value, 0);
  const hasTotal = Number.isFinite(total) && total > 0;
  if (!hasTotal && slices.length > 0) {
    warn(
      `PieChart:total:${total}`,
      `PieChart values must have a finite positive total; received ${total}. No slices were drawn.`,
    );
  }
  return {
    kind: "pie",
    values: hasTotal ? slices : [],
    categoryLabel: safeCategoryLabel,
    valueLabel: safeValueLabel,
    formatY: formatY ?? String,
  };
}

export function cartesianChartContext(
  warn: Warn,
  chartName: string,
  kind: "area" | "line",
  values: readonly CartesianChartValue[],
  xLabel: string,
  yLabel: string,
  formatX: Formatter<number | Date>,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: CartesianChartValue[] = [];
  let previousX: number | undefined;
  for (const [index, value] of values.entries()) {
    const x = numberOf(value.x);
    if (!Number.isFinite(x)) {
      skipped(
        warn,
        chartName,
        `x:${index}`,
        `x value at index ${index} must be finite; received ${value.x}.`,
      );
      continue;
    }
    if (!Number.isFinite(value.y)) {
      skipped(
        warn,
        chartName,
        `y:${index}`,
        `y value at index ${index} must be finite; received ${value.y}.`,
      );
      continue;
    }
    if (previousX !== undefined && x <= previousX) {
      skipped(
        warn,
        chartName,
        `order:${index}`,
        `x values must increase; the value before index ${index} is ${previousX} and index ${index} is ${x}.`,
      );
      continue;
    }
    previousX = x;
    valid.push(value);
  }
  return {
    kind,
    values: valid,
    xLabel: labelOr(warn, chartName, "x-axis", xLabel, "X"),
    yLabel: labelOr(warn, chartName, "y-axis", yLabel, "Y"),
    formatX: formatX ?? String,
    formatY: formatY ?? String,
  };
}

export function scatterChartContext(
  warn: Warn,
  values: readonly ScatterChartValue[],
  xLabel: string,
  yLabel: string,
  formatX: Formatter<number | Date>,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: ScatterChartValue[] = [];
  for (const [index, value] of values.entries()) {
    if (!value.label.trim()) {
      skipped(
        warn,
        "ScatterChart",
        `empty-label:${index}`,
        `value at index ${index} has an empty label.`,
      );
      continue;
    }
    if (!Number.isFinite(numberOf(value.x)) || !Number.isFinite(value.y)) {
      skipped(
        warn,
        "ScatterChart",
        `non-finite:${value.label}`,
        `value "${value.label}" must have finite coordinates; received x=${value.x}, y=${value.y}.`,
      );
      continue;
    }
    valid.push(value);
  }
  return {
    kind: "scatter",
    values: valid,
    xLabel: labelOr(warn, "ScatterChart", "x-axis", xLabel, "X"),
    yLabel: labelOr(warn, "ScatterChart", "y-axis", yLabel, "Y"),
    formatX: formatX ?? String,
    formatY: formatY ?? String,
  };
}

export function stackedChartContext(
  warn: Warn,
  chartName: string,
  kind: "stacked-bar" | "stacked-column",
  values: readonly StackedChartValue[],
  categoryLabel: string,
  valueLabel: string,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: StackedChartValue[] = [];
  let expectedSegments: readonly string[] | undefined;
  for (const [categoryIndex, value] of values.entries()) {
    if (!value.label.trim()) {
      skipped(
        warn,
        chartName,
        `empty-label:${categoryIndex}`,
        `value at index ${categoryIndex} has an empty label.`,
      );
      continue;
    }
    const segmentLabels = value.segments.map((segment) => segment.label);
    const duplicateSegment = segmentLabels.find(
      (label, index) => segmentLabels.indexOf(label) !== index,
    );
    if (duplicateSegment !== undefined) {
      skipped(
        warn,
        chartName,
        `duplicate-segment:${value.label}:${duplicateSegment}`,
        `category "${value.label}" has duplicate segment label "${duplicateSegment}".`,
      );
      continue;
    }
    if (expectedSegments !== undefined && !sameOrderedLabels(segmentLabels, expectedSegments)) {
      skipped(
        warn,
        chartName,
        `segments:${value.label}`,
        `category "${value.label}" must use the same ordered segments as the first category.`,
      );
      continue;
    }
    const badSegment = value.segments.find(
      (segment) => !segment.label.trim() || !Number.isFinite(segment.value) || segment.value < 0,
    );
    if (badSegment) {
      skipped(
        warn,
        chartName,
        `segment-value:${value.label}:${badSegment.label}`,
        `segment "${badSegment.label}" in "${value.label}" must have a label and a finite non-negative number; received ${badSegment.value}.`,
      );
      continue;
    }
    expectedSegments ??= segmentLabels;
    valid.push(value);
  }
  return {
    kind,
    values: valid,
    categoryLabel: labelOr(warn, chartName, "category", categoryLabel, "Category"),
    valueLabel: labelOr(warn, chartName, "value", valueLabel, "Value"),
    formatY: formatY ?? String,
  };
}

export function histogramChartContext(
  warn: Warn,
  values: readonly number[],
  valueLabel: string,
  frequencyLabel: string,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: number[] = [];
  for (const [index, value] of values.entries()) {
    if (!Number.isFinite(value)) {
      skipped(
        warn,
        "HistogramChart",
        `non-finite:${index}`,
        `value at index ${index} must be finite; received ${value}.`,
      );
      continue;
    }
    valid.push(value);
  }
  return {
    kind: "histogram",
    values: valid,
    valueLabel: labelOr(warn, "HistogramChart", "value", valueLabel, "Value"),
    frequencyLabel: labelOr(warn, "HistogramChart", "frequency", frequencyLabel, "Frequency"),
    formatY: formatY ?? String,
  };
}

export function heatmapChartContext(
  warn: Warn,
  values: readonly HeatmapChartValue[],
  xLabel: string,
  yLabel: string,
  valueLabel: string,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: HeatmapChartValue[] = [];
  const coordinates = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (!value.x.trim() || !value.y.trim()) {
      skipped(
        warn,
        "HeatmapChart",
        `empty-coordinate:${index}`,
        `value at index ${index} must have non-empty x and y labels.`,
      );
      continue;
    }
    if (!Number.isFinite(value.value)) {
      skipped(
        warn,
        "HeatmapChart",
        `non-finite:${value.x}:${value.y}`,
        `value at x="${value.x}", y="${value.y}" must be finite; received ${value.value}.`,
      );
      continue;
    }
    const coordinate = JSON.stringify([value.x, value.y]);
    if (coordinates.has(coordinate)) {
      skipped(
        warn,
        "HeatmapChart",
        `duplicate:${coordinate}`,
        `contains more than one value at x="${value.x}", y="${value.y}"; only the first is kept.`,
      );
      continue;
    }
    coordinates.add(coordinate);
    valid.push(value);
  }
  return {
    kind: "heatmap",
    values: valid,
    xLabel: labelOr(warn, "HeatmapChart", "x-axis", xLabel, "X"),
    yLabel: labelOr(warn, "HeatmapChart", "y-axis", yLabel, "Y"),
    valueLabel: labelOr(warn, "HeatmapChart", "value", valueLabel, "Value"),
    formatY: formatY ?? String,
  };
}

export function mapChartContext(
  warn: Warn,
  values: readonly MapChartValue[],
  regionLabel: string,
  valueLabel: string,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: MapChartValue[] = [];
  const ids = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (!value.id.trim() || !value.label.trim()) {
      skipped(
        warn,
        "MapChart",
        `empty-id:${index}`,
        `value at index ${index} must have a non-empty id and label.`,
      );
      continue;
    }
    if (ids.has(value.id)) {
      skipped(warn, "MapChart", `duplicate:${value.id}`, `region id "${value.id}" is duplicated.`);
      continue;
    }
    if (!Number.isFinite(value.value)) {
      skipped(
        warn,
        "MapChart",
        `non-finite:${value.id}`,
        `region "${value.id}" must have a finite value; received ${value.value}.`,
      );
      continue;
    }
    ids.add(value.id);
    valid.push(value);
  }
  return {
    kind: "map",
    values: valid,
    regionLabel: labelOr(warn, "MapChart", "region", regionLabel, "Region"),
    valueLabel: labelOr(warn, "MapChart", "value", valueLabel, "Value"),
    formatY: formatY ?? String,
  };
}

/** True when `target` already reaches `source`, so a source-to-target link would close a cycle. */
function closesCycle(outgoing: ReadonlyMap<string, string[]>, source: string, target: string) {
  const pending = [target];
  const seen = new Set<string>();
  while (pending.length > 0) {
    const id = pending.pop()!;
    if (id === source) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push(...(outgoing.get(id) ?? []));
  }
  return false;
}

export function sankeyChartContext(
  warn: Warn,
  nodes: readonly SankeyChartNodeValue[],
  links: readonly SankeyChartLinkValue[],
  nodeLabel: string,
  valueLabel: string,
  formatY: Formatter<number>,
): ChartContextValue {
  const validNodes: SankeyChartNodeValue[] = [];
  const ids = new Set<string>();
  for (const [index, node] of nodes.entries()) {
    if (!node.id.trim() || !node.label.trim()) {
      skipped(
        warn,
        "SankeyChart",
        `empty-node:${index}`,
        `node at index ${index} must have a non-empty id and label.`,
      );
      continue;
    }
    if (ids.has(node.id)) {
      skipped(
        warn,
        "SankeyChart",
        `duplicate-node:${node.id}`,
        `node id "${node.id}" is duplicated.`,
      );
      continue;
    }
    ids.add(node.id);
    validNodes.push(node);
  }
  const outgoing = new Map<string, string[]>();
  const validLinks: SankeyChartLinkValue[] = [];
  for (const [index, link] of links.entries()) {
    const key = `${link.source}>${link.target}`;
    if (!ids.has(link.source) || !ids.has(link.target)) {
      skipped(
        warn,
        "SankeyChart",
        `unknown-node:${key}`,
        `link at index ${index} references unknown nodes source="${link.source}", target="${link.target}".`,
      );
      continue;
    }
    if (link.source === link.target) {
      skipped(
        warn,
        "SankeyChart",
        `self-link:${key}`,
        `link at index ${index} cannot connect node "${link.source}" to itself.`,
      );
      continue;
    }
    if (!Number.isFinite(link.value) || link.value <= 0) {
      skipped(
        warn,
        "SankeyChart",
        `value:${key}`,
        `link from "${link.source}" to "${link.target}" must have a finite positive value; received ${link.value}.`,
      );
      continue;
    }
    if (closesCycle(outgoing, link.source, link.target)) {
      skipped(
        warn,
        "SankeyChart",
        `cycle:${key}`,
        `link from "${link.source}" to "${link.target}" would close a cycle; links must form an acyclic flow from left to right.`,
      );
      continue;
    }
    outgoing.set(link.source, [...(outgoing.get(link.source) ?? []), link.target]);
    validLinks.push(link);
  }
  return {
    kind: "sankey",
    nodes: validNodes,
    links: validLinks,
    nodeLabel: labelOr(warn, "SankeyChart", "node", nodeLabel, "Node"),
    valueLabel: labelOr(warn, "SankeyChart", "value", valueLabel, "Value"),
    formatY: formatY ?? String,
  };
}

type CandlestickLabels = {
  openLabel: string;
  highLabel: string;
  lowLabel: string;
  closeLabel: string;
};

export function candlestickChartContext(
  warn: Warn,
  values: readonly CandlestickChartValue[],
  xLabel: string,
  yLabel: string,
  labels: CandlestickLabels,
  formatX: Formatter<number | Date>,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: CandlestickChartValue[] = [];
  let previousX: number | undefined;
  for (const [index, value] of values.entries()) {
    const x = numberOf(value.x);
    if (!Number.isFinite(x)) {
      skipped(
        warn,
        "CandlestickChart",
        `x:${index}`,
        `x value at index ${index} must be finite; received ${value.x}.`,
      );
      continue;
    }
    const badField = (["open", "high", "low", "close"] as const).find(
      (field) => !Number.isFinite(value[field]),
    );
    if (badField) {
      skipped(
        warn,
        "CandlestickChart",
        `${badField}:${index}`,
        `${badField} value at index ${index} must be finite; received ${value[badField]}.`,
      );
      continue;
    }
    if (previousX !== undefined && x <= previousX) {
      skipped(
        warn,
        "CandlestickChart",
        `order:${index}`,
        `x values must increase; the value before index ${index} is ${previousX} and index ${index} is ${x}.`,
      );
      continue;
    }
    if (value.low > Math.min(value.open, value.close)) {
      skipped(
        warn,
        "CandlestickChart",
        `low:${index}`,
        `low at index ${index} must not exceed open or close; received low=${value.low}, open=${value.open}, close=${value.close}.`,
      );
      continue;
    }
    if (value.high < Math.max(value.open, value.close)) {
      skipped(
        warn,
        "CandlestickChart",
        `high:${index}`,
        `high at index ${index} must not be below open or close; received high=${value.high}, open=${value.open}, close=${value.close}.`,
      );
      continue;
    }
    previousX = x;
    valid.push(value);
  }
  return {
    kind: "candlestick",
    values: valid,
    xLabel: labelOr(warn, "CandlestickChart", "x-axis", xLabel, "X"),
    yLabel: labelOr(warn, "CandlestickChart", "y-axis", yLabel, "Y"),
    openLabel: labelOr(warn, "CandlestickChart", "open", labels.openLabel, "Open"),
    highLabel: labelOr(warn, "CandlestickChart", "high", labels.highLabel, "High"),
    lowLabel: labelOr(warn, "CandlestickChart", "low", labels.lowLabel, "Low"),
    closeLabel: labelOr(warn, "CandlestickChart", "close", labels.closeLabel, "Close"),
    formatX: formatX ?? String,
    formatY: formatY ?? String,
  };
}

export function dumbbellChartContext(
  warn: Warn,
  values: readonly DumbbellChartValue[],
  categoryLabel: string,
  valueLabel: string,
  startLabel: string,
  endLabel: string,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: DumbbellChartValue[] = [];
  for (const [index, value] of values.entries()) {
    if (!value.label.trim()) {
      skipped(
        warn,
        "DumbbellChart",
        `empty-label:${index}`,
        `value at index ${index} has an empty label.`,
      );
      continue;
    }
    if (!Number.isFinite(value.start) || !Number.isFinite(value.end)) {
      skipped(
        warn,
        "DumbbellChart",
        `non-finite:${value.label}`,
        `value "${value.label}" must have finite endpoints; received start=${value.start}, end=${value.end}.`,
      );
      continue;
    }
    valid.push(value);
  }
  return {
    kind: "dumbbell",
    values: valid,
    categoryLabel: labelOr(warn, "DumbbellChart", "category", categoryLabel, "Category"),
    valueLabel: labelOr(warn, "DumbbellChart", "value", valueLabel, "Value"),
    startLabel: labelOr(warn, "DumbbellChart", "start", startLabel, "Start"),
    endLabel: labelOr(warn, "DumbbellChart", "end", endLabel, "End"),
    formatY: formatY ?? String,
  };
}

export function boxPlotChartContext(
  warn: Warn,
  values: readonly BoxPlotChartValue[],
  categoryLabel: string,
  valueLabel: string,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: BoxPlotChartValue[] = [];
  for (const [index, value] of values.entries()) {
    if (!value.label.trim()) {
      skipped(
        warn,
        "BoxPlotChart",
        `empty-label:${index}`,
        `value at index ${index} has an empty label.`,
      );
      continue;
    }
    const summary = `min=${value.min}, q1=${value.q1}, median=${value.median}, q3=${value.q3}, max=${value.max}`;
    if (
      [value.min, value.q1, value.median, value.q3, value.max].some(
        (part) => !Number.isFinite(part),
      )
    ) {
      skipped(
        warn,
        "BoxPlotChart",
        `non-finite:${value.label}`,
        `value "${value.label}" must have finite summary values; received ${summary}.`,
      );
      continue;
    }
    if (
      !(
        value.min <= value.q1 &&
        value.q1 <= value.median &&
        value.median <= value.q3 &&
        value.q3 <= value.max
      )
    ) {
      skipped(
        warn,
        "BoxPlotChart",
        `order:${value.label}`,
        `value "${value.label}" must satisfy min ≤ q1 ≤ median ≤ q3 ≤ max; received ${summary}.`,
      );
      continue;
    }
    valid.push(value);
  }
  return {
    kind: "boxplot",
    values: valid,
    categoryLabel: labelOr(warn, "BoxPlotChart", "category", categoryLabel, "Category"),
    valueLabel: labelOr(warn, "BoxPlotChart", "value", valueLabel, "Value"),
    formatY: formatY ?? String,
  };
}

export function openToCloseChartContext(
  warn: Warn,
  values: readonly OpenToCloseChartValue[],
  xLabel: string,
  yLabel: string,
  openLabel: string,
  closeLabel: string,
  formatX: Formatter<number | Date>,
  formatY: Formatter<number>,
): ChartContextValue {
  const valid: OpenToCloseChartValue[] = [];
  let previousX: number | undefined;
  for (const [index, value] of values.entries()) {
    const x = numberOf(value.x);
    if (!Number.isFinite(x) || !Number.isFinite(value.open) || !Number.isFinite(value.close)) {
      skipped(
        warn,
        "OpenToCloseChart",
        `non-finite:${index}`,
        `value at index ${index} must have finite coordinates; received x=${value.x}, open=${value.open}, close=${value.close}.`,
      );
      continue;
    }
    if (previousX !== undefined && x <= previousX) {
      skipped(
        warn,
        "OpenToCloseChart",
        `order:${index}`,
        `x values must increase; the value before index ${index} is ${previousX} and index ${index} is ${x}.`,
      );
      continue;
    }
    previousX = x;
    valid.push(value);
  }
  return {
    kind: "open-to-close",
    values: valid,
    xLabel: labelOr(warn, "OpenToCloseChart", "x-axis", xLabel, "X"),
    yLabel: labelOr(warn, "OpenToCloseChart", "y-axis", yLabel, "Y"),
    openLabel: labelOr(warn, "OpenToCloseChart", "open", openLabel, "Open"),
    closeLabel: labelOr(warn, "OpenToCloseChart", "close", closeLabel, "Close"),
    formatX: formatX ?? String,
    formatY: formatY ?? String,
  };
}
