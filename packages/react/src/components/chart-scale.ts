type ChartScaleValue = {
  label: string;
  value: number;
};

type ChartScaleOptions = {
  domain: "extent" | "include-zero";
  max?: number | undefined;
  min?: number | undefined;
};

export function createChartScale(
  chartName: string,
  values: readonly ChartScaleValue[],
  options: ChartScaleOptions,
) {
  const measuredMin = Math.min(...values.map((value) => value.value));
  const measuredMax = Math.max(...values.map((value) => value.value));
  let scaleMin = options.min ?? measuredMin;
  let scaleMax = options.max ?? measuredMax;
  if (values.length === 0) {
    scaleMin = options.min ?? 0;
    scaleMax = options.max ?? 1;
  }
  if (options.domain === "include-zero") {
    scaleMin = options.min ?? Math.min(0, scaleMin);
    scaleMax = options.max ?? Math.max(0, scaleMax);
  }
  if (!Number.isFinite(scaleMin) || !Number.isFinite(scaleMax)) {
    throw new Error(
      `${chartName} bounds must be finite; received min=${scaleMin}, max=${scaleMax}.`,
    );
  }
  if (
    scaleMax < scaleMin ||
    (scaleMax === scaleMin && (options.min !== undefined || options.max !== undefined))
  ) {
    throw new Error(
      `${chartName} max must be greater than min; received min=${scaleMin}, max=${scaleMax}.`,
    );
  }
  if (scaleMax === scaleMin) {
    scaleMin -= 0.5;
    scaleMax += 0.5;
  }
  for (const value of values) {
    if (value.value < scaleMin || value.value > scaleMax) {
      throw new Error(
        `${chartName} value "${value.label}" (${value.value}) is outside min=${scaleMin}, max=${scaleMax}.`,
      );
    }
  }

  const span = scaleMax - scaleMin;
  return {
    max: scaleMax,
    min: scaleMin,
    position: (value: number) => (value - scaleMin) / span,
    ticks: (count: number) =>
      Array.from({ length: count }, (_, index) => scaleMin + (index / (count - 1)) * span),
  };
}

export function chartTickCount(
  chartName: string,
  count: number | undefined,
  propName = "yTickCount",
) {
  const resolved = count ?? 5;
  if (!Number.isInteger(resolved) || resolved < 2) {
    throw new Error(
      `${chartName} ${propName} must be an integer of at least 2; received ${resolved}.`,
    );
  }
  return resolved;
}
