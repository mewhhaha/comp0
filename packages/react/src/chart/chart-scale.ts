import { type Warn } from "../internal/dev.js";

type ChartScaleValue = {
  label: string;
  value: number;
};

type ChartScaleOptions = {
  domain: "extent" | "include-zero";
  max?: number | undefined;
  min?: number | undefined;
};

type ChartAxisTick = {
  label: string;
  position: number;
};

type ScaleBounds = { min: number; max: number };

function finiteBound(
  warn: Warn,
  chartName: string,
  name: "min" | "max",
  bound: number | undefined,
) {
  if (bound === undefined || Number.isFinite(bound)) return bound;
  warn(
    `${chartName}:${name}-bound`,
    `${chartName} ${name} must be finite; received ${bound}. It was ignored.`,
  );
  return undefined;
}

function measuredBounds(
  values: readonly ChartScaleValue[],
  domain: ChartScaleOptions["domain"],
  min: number | undefined,
  max: number | undefined,
): ScaleBounds {
  let measuredMin = Number.POSITIVE_INFINITY;
  let measuredMax = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    measuredMin = Math.min(measuredMin, value.value);
    measuredMax = Math.max(measuredMax, value.value);
  }
  let scaleMin = min ?? measuredMin;
  let scaleMax = max ?? measuredMax;
  if (values.length === 0) {
    if (min !== undefined && max === undefined) {
      scaleMin = min;
      scaleMax = min + 1;
    } else if (max !== undefined && min === undefined) {
      scaleMin = max - 1;
      scaleMax = max;
    } else {
      scaleMin = min ?? 0;
      scaleMax = max ?? 1;
    }
  }
  if (domain === "include-zero") {
    scaleMin = min ?? Math.min(0, scaleMin);
    scaleMax = max ?? Math.max(0, scaleMax);
  }
  return { min: scaleMin, max: scaleMax };
}

/**
 * Maps chart values onto 0..1. Invalid bounds are ignored and values outside the bounds are
 * clamped onto the edge, each with a development warning, so a bad prop never blanks the chart.
 */
export function createChartScale(
  warn: Warn,
  chartName: string,
  values: readonly ChartScaleValue[],
  options: ChartScaleOptions,
) {
  let min = finiteBound(warn, chartName, "min", options.min);
  let max = finiteBound(warn, chartName, "max", options.max);
  let bounds = measuredBounds(values, options.domain, min, max);
  if (
    !Number.isFinite(bounds.min) ||
    !Number.isFinite(bounds.max) ||
    bounds.max < bounds.min ||
    (bounds.max === bounds.min && (min !== undefined || max !== undefined))
  ) {
    warn(
      `${chartName}:bounds:${bounds.min}:${bounds.max}`,
      `${chartName} max must be greater than min; received min=${bounds.min}, max=${bounds.max}. The bounds were derived from the values instead.`,
    );
    min = undefined;
    max = undefined;
    bounds = measuredBounds(values, options.domain, min, max);
  }
  let scaleMin = bounds.min;
  let scaleMax = bounds.max;
  if (!Number.isFinite(scaleMin) || !Number.isFinite(scaleMax)) {
    scaleMin = 0;
    scaleMax = 1;
  }
  if (scaleMax === scaleMin) {
    scaleMin -= 0.5;
    scaleMax += 0.5;
  }
  for (const value of values) {
    if (value.value < scaleMin || value.value > scaleMax) {
      warn(
        `${chartName}:outside:${value.label}`,
        `${chartName} value "${value.label}" (${value.value}) is outside min=${scaleMin}, max=${scaleMax}. It was drawn at the nearest edge.`,
      );
    }
  }

  const span = scaleMax - scaleMin;
  const position = (value: number) => Math.min(1, Math.max(0, (value - scaleMin) / span));
  const ticks = (count: number) =>
    Array.from({ length: count }, (_, index) => scaleMin + (index / (count - 1)) * span);
  return {
    max: scaleMax,
    min: scaleMin,
    position,
    ticks,
    /** Evenly spaced axis ticks, labelled with `format`. */
    axisTicks: (count: number, format: (value: number) => string): ChartAxisTick[] =>
      ticks(count).map((value) => ({ label: format(value), position: position(value) })),
  };
}

/** Resolves a tick count prop; anything but an integer of at least 2 falls back to 5. */
export function chartTickCount(
  warn: Warn,
  chartName: string,
  count: number | undefined,
  propName = "yTickCount",
) {
  const resolved = count ?? 5;
  if (!Number.isInteger(resolved) || resolved < 2) {
    warn(
      `${chartName}:${propName}:${resolved}`,
      `${chartName} ${propName} must be an integer of at least 2; received ${resolved}. It was replaced by 5.`,
    );
    return 5;
  }
  return resolved;
}
