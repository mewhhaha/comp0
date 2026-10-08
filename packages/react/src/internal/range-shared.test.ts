import { describe, expect, it } from "vitest";
import { isRtl, snapToStep, valueAtPointer } from "./range-shared.js";

describe("snapToStep", () => {
  it("snaps to the grid anchored at min", () => {
    expect(snapToStep(23, 0, 100, 5)).toBe(25);
    expect(snapToStep(22, 0, 100, 5)).toBe(20);
    expect(snapToStep(7, 3, 100, 5)).toBe(8);
  });

  it("clamps into [min, max]", () => {
    expect(snapToStep(-40, 0, 100, 5)).toBe(0);
    expect(snapToStep(140, 0, 100, 5)).toBe(100);
    // The grid can overshoot max; the clamp wins.
    expect(snapToStep(99, 0, 98, 5)).toBe(98);
  });

  it("trims floating-point residue", () => {
    expect(snapToStep(0.3, 0, 1, 0.1)).toBe(0.3);
    expect(snapToStep(30.000000000000004, 0, 100, 0.1)).toBe(30);
  });
});

describe("valueAtPointer", () => {
  const rect = { left: 100, bottom: 300, width: 200, height: 100 };

  it("maps a horizontal position onto the range", () => {
    expect(valueAtPointer({ clientX: 100, clientY: 0 }, rect, "horizontal", 0, 50)).toBe(0);
    expect(valueAtPointer({ clientX: 200, clientY: 0 }, rect, "horizontal", 0, 50)).toBe(25);
    expect(valueAtPointer({ clientX: 300, clientY: 0 }, rect, "horizontal", 0, 50)).toBe(50);
  });

  it("mirrors a horizontal track in right-to-left layouts", () => {
    expect(valueAtPointer({ clientX: 100, clientY: 0 }, rect, "horizontal", 0, 50, true)).toBe(50);
    expect(valueAtPointer({ clientX: 250, clientY: 0 }, rect, "horizontal", 0, 50, true)).toBe(
      12.5,
    );
  });

  it("maps a vertical position with the low end at the bottom", () => {
    expect(valueAtPointer({ clientX: 0, clientY: 300 }, rect, "vertical", 10, 20)).toBe(10);
    expect(valueAtPointer({ clientX: 0, clientY: 250 }, rect, "vertical", 10, 20)).toBe(15);
    expect(valueAtPointer({ clientX: 0, clientY: 200 }, rect, "vertical", 10, 20)).toBe(20);
  });

  it("clamps pointers outside the track", () => {
    expect(valueAtPointer({ clientX: 0, clientY: 0 }, rect, "horizontal", 0, 10)).toBe(0);
    expect(valueAtPointer({ clientX: 900, clientY: 0 }, rect, "horizontal", 0, 10)).toBe(10);
    expect(valueAtPointer({ clientX: 0, clientY: 900 }, rect, "vertical", 0, 10)).toBe(0);
  });

  it("returns undefined for a track with no size", () => {
    const flat = { left: 0, bottom: 0, width: 0, height: 0 };
    expect(valueAtPointer({ clientX: 5, clientY: 5 }, flat, "horizontal", 0, 10)).toBeUndefined();
    expect(valueAtPointer({ clientX: 5, clientY: 5 }, flat, "vertical", 0, 10)).toBeUndefined();
  });
});

describe("isRtl", () => {
  it("reads the computed writing direction", () => {
    const element = document.createElement("div");
    document.body.append(element);
    expect(isRtl(element)).toBe(false);
    element.style.direction = "rtl";
    expect(isRtl(element)).toBe(true);
    element.remove();
  });
});
