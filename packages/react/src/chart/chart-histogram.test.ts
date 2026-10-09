import { warnOnce } from "../internal/dev.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { binHistogram } from "./chart-histogram.js";

const auto = { binCount: undefined, xMin: undefined, xMax: undefined };

describe("binHistogram", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("groups observations into equal-width bins with an inclusive last bin", () => {
    const { bins, binCount } = binHistogram(warnOnce, "Hist", [0, 1, 2, 3, 4], {
      ...auto,
      binCount: 2,
    });
    expect(binCount).toBe(2);
    expect(bins).toEqual([
      { min: 0, max: 2, count: 2 },
      { min: 2, max: 4, count: 3 },
    ]);
  });

  it("defaults to the square root of the observation count", () => {
    expect(binHistogram(warnOnce, "Hist", [1, 2, 3, 4, 5, 6, 7, 8, 9], auto).binCount).toBe(3);
    expect(binHistogram(warnOnce, "Hist", [], auto).binCount).toBe(1);
  });

  it("honours explicit x bounds", () => {
    const { bins, xScale } = binHistogram(warnOnce, "Hist", [1, 9], {
      binCount: 2,
      xMin: 0,
      xMax: 10,
    });
    expect([xScale.min, xScale.max]).toEqual([0, 10]);
    expect(bins.map((bin) => bin.count)).toEqual([1, 1]);
  });

  it("replaces an invalid bin count with the default and warns", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { binCount } = binHistogram(warnOnce, "HistBad", [1, 2, 3, 4], { ...auto, binCount: 0 });
    expect(binCount).toBe(2);
    expect(error).toHaveBeenCalledWith(
      "HistBad binCount must be a positive integer; received 0. It was replaced by 2.",
    );
  });
});
