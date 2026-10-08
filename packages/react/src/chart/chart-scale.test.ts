import { afterEach, describe, expect, it, vi } from "vitest";
import { chartTickCount, createChartScale } from "./chart-scale.js";

function values(...numbers: number[]) {
  return numbers.map((value, index) => ({ label: `scale-${index}`, value }));
}

function spyOnErrors() {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}

describe("createChartScale", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("includes zero for include-zero domains and maps values onto 0..1", () => {
    const scale = createChartScale("ScaleA", values(10, 30), { domain: "include-zero" });
    expect([scale.min, scale.max]).toEqual([0, 30]);
    expect(scale.position(0)).toBe(0);
    expect(scale.position(15)).toBe(0.5);
    expect(scale.position(30)).toBe(1);
  });

  it("uses the measured extent for extent domains", () => {
    const scale = createChartScale("ScaleB", values(10, 30), { domain: "extent" });
    expect([scale.min, scale.max]).toEqual([10, 30]);
    expect(scale.position(20)).toBe(0.5);
  });

  it("honours explicit bounds and derives the missing one for empty data", () => {
    expect(createChartScale("ScaleC", [], { domain: "extent" })).toMatchObject({ min: 0, max: 1 });
    expect(createChartScale("ScaleC", [], { domain: "extent", min: 5 })).toMatchObject({
      min: 5,
      max: 6,
    });
    expect(createChartScale("ScaleC", [], { domain: "extent", max: 5 })).toMatchObject({
      min: 4,
      max: 5,
    });
    expect(
      createChartScale("ScaleC", values(1, 2), { domain: "extent", min: 0, max: 10 }),
    ).toMatchObject({
      min: 0,
      max: 10,
    });
  });

  it("widens a zero-width domain around its single value", () => {
    const scale = createChartScale("ScaleD", values(4), { domain: "extent" });
    expect([scale.min, scale.max]).toEqual([3.5, 4.5]);
    expect(scale.position(4)).toBe(0.5);
  });

  it("returns evenly spaced ticks and labelled axis ticks", () => {
    const scale = createChartScale("ScaleE", values(0, 100), { domain: "extent" });
    expect(scale.ticks(3)).toEqual([0, 50, 100]);
    expect(scale.axisTicks(3, (value) => `${value}%`)).toEqual([
      { label: "0%", position: 0 },
      { label: "50%", position: 0.5 },
      { label: "100%", position: 1 },
    ]);
  });

  it("ignores non-finite bounds with a warning", () => {
    const error = spyOnErrors();
    const scale = createChartScale("ScaleF", values(2, 6), {
      domain: "extent",
      min: Number.NaN,
      max: Number.POSITIVE_INFINITY,
    });
    expect([scale.min, scale.max]).toEqual([2, 6]);
    expect(error.mock.calls.map(([message]) => message)).toEqual([
      "ScaleF min must be finite; received NaN. It was ignored.",
      "ScaleF max must be finite; received Infinity. It was ignored.",
    ]);
  });

  it("derives bounds from the values when max does not exceed min", () => {
    const error = spyOnErrors();
    const scale = createChartScale("ScaleG", values(1, 5), { domain: "extent", min: 9, max: 3 });
    expect([scale.min, scale.max]).toEqual([1, 5]);
    expect(error).toHaveBeenCalledWith(
      "ScaleG max must be greater than min; received min=9, max=3. The bounds were derived from the values instead.",
    );
  });

  it("clamps values outside the bounds onto the nearest edge with a warning", () => {
    const error = spyOnErrors();
    const scale = createChartScale("ScaleH", values(-5, 20), {
      domain: "extent",
      min: 0,
      max: 10,
    });
    expect(scale.position(-5)).toBe(0);
    expect(scale.position(20)).toBe(1);
    expect(error.mock.calls.map(([message]) => message)).toEqual([
      'ScaleH value "scale-0" (-5) is outside min=0, max=10. It was drawn at the nearest edge.',
      'ScaleH value "scale-1" (20) is outside min=0, max=10. It was drawn at the nearest edge.',
    ]);
  });
});

describe("chartTickCount", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to five and accepts integers of at least two", () => {
    expect(chartTickCount("TickA", undefined)).toBe(5);
    expect(chartTickCount("TickA", 2)).toBe(2);
    expect(chartTickCount("TickA", 9)).toBe(9);
  });

  it("falls back to five with a warning for anything else", () => {
    const error = spyOnErrors();
    expect(chartTickCount("TickB", 1, "xTickCount")).toBe(5);
    expect(chartTickCount("TickB", 2.5)).toBe(5);
    expect(error.mock.calls.map(([message]) => message)).toEqual([
      "TickB xTickCount must be an integer of at least 2; received 1. It was replaced by 5.",
      "TickB yTickCount must be an integer of at least 2; received 2.5. It was replaced by 5.",
    ]);
  });
});
