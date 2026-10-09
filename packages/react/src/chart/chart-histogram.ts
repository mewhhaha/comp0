import { type Warn } from "../internal/dev.js";
import { createChartScale } from "./chart-scale.js";
import { type HistogramBinValue } from "./chart-shared.js";
import { type HistogramBinOptions } from "./chart-meta.js";

/** Groups observations into equal-width bins; the plot and the default table share it. */
export function binHistogram(
  warn: Warn,
  chartName: string,
  values: readonly number[],
  { binCount, xMin, xMax }: HistogramBinOptions,
) {
  const defaultBinCount = Math.max(1, Math.ceil(Math.sqrt(values.length)));
  let resolvedBinCount = binCount ?? defaultBinCount;
  if (!Number.isInteger(resolvedBinCount) || resolvedBinCount < 1) {
    warn(
      `${chartName}:bin-count:${resolvedBinCount}`,
      `${chartName} binCount must be a positive integer; received ${resolvedBinCount}. It was replaced by ${defaultBinCount}.`,
    );
    resolvedBinCount = defaultBinCount;
  }
  const observations = values.map((value, index) => ({ label: String(index), value }));
  const xScale = createChartScale(warn, `${chartName} x axis`, observations, {
    domain: "extent",
    min: xMin,
    max: xMax,
  });
  const binWidth = (xScale.max - xScale.min) / resolvedBinCount;
  const bins = Array.from({ length: resolvedBinCount }, (_, index): HistogramBinValue => ({
    min: xScale.min + index * binWidth,
    max: xScale.min + (index + 1) * binWidth,
    count: 0,
  }));
  for (const value of values) {
    const index = Math.min(
      resolvedBinCount - 1,
      Math.floor(((value - xScale.min) / (xScale.max - xScale.min)) * resolvedBinCount),
    );
    const bin = bins[index];
    if (bin) bin.count += 1;
  }
  return { bins, binCount: resolvedBinCount, xScale };
}
