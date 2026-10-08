import { afterEach, describe, expect, it, vi } from "vitest";
import {
  colorCoordinatesForValue,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  normalizeHexColorProp,
} from "./color-picker-shared.js";

describe("hex color helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes three- and six-digit colors to lowercase six-digit hex", () => {
    expect(normalizeHexColor("#F00")).toBe("#ff0000");
    expect(normalizeHexColor(" 0D9488 ")).toBe("#0d9488");
    expect(normalizeHexColor("#12")).toBeUndefined();
    expect(normalizeHexColor("#12345g")).toBeUndefined();
    expect(normalizeHexColor("")).toBeUndefined();
  });

  it("converts between hex and hue/saturation/brightness", () => {
    expect(hexToHsv("#ff0000")).toEqual({ hue: 0, saturation: 100, brightness: 100 });
    expect(hexToHsv("#00ff00").hue).toBe(120);
    expect(hexToHsv("#0000ff").hue).toBe(240);
    expect(hexToHsv("#000000")).toEqual({ hue: 0, saturation: 0, brightness: 0 });
    expect(hsvToHex({ hue: 120, saturation: 100, brightness: 100 })).toBe("#00ff00");
    expect(hsvToHex({ hue: 480, saturation: 150, brightness: -5 })).toBe("#000000");
    for (const hex of ["#0d9488", "#ff8080", "#123456"]) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
  });

  it("throws on an unparseable color handed to the converter", () => {
    expect(() => hexToHsv("nope")).toThrow(
      'Color value "nope" must be a three- or six-digit hex color.',
    );
  });

  it("keeps the previous hue and saturation where the new color has none", () => {
    const previous = { hue: 200, saturation: 40, brightness: 80 };

    expect(colorCoordinatesForValue(previous, "#000000")).toEqual({
      hue: 200,
      saturation: 40,
      brightness: 0,
    });
    expect(colorCoordinatesForValue(previous, "#808080")).toEqual({
      hue: 200,
      saturation: 0,
      brightness: hexToHsv("#808080").brightness,
    });
    expect(colorCoordinatesForValue(previous, "#ff0000").hue).toBe(0);
  });

  it("warns once per bad prop value and returns undefined", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(normalizeHexColorProp("Swatch", "color", "bad-shared")).toBeUndefined();
    expect(normalizeHexColorProp("Swatch", "color", "bad-shared")).toBeUndefined();
    expect(normalizeHexColorProp("Swatch", "color", "#abc")).toBe("#aabbcc");

    expect(error.mock.calls).toEqual([
      ['Swatch color "bad-shared" must be a three- or six-digit hex color. It was ignored.'],
    ]);
  });
});
