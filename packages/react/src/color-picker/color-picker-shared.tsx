import { createRequiredContext } from "../internal/context.js";
import { type Warn } from "../internal/dev.js";

export type HsvColor = {
  hue: number;
  saturation: number;
  brightness: number;
};

export type ColorPickerContextValue = {
  color: HsvColor;
  controlId: string;
  disabled: boolean;
  inputId: string;
  value: string;
  setColor: (color: HsvColor) => void;
  setValue: (value: string) => void;
};

export const [ColorPickerContext, useColorPickerContext, useOptionalColorPickerContext] =
  createRequiredContext<ColorPickerContextValue>("ColorPicker");

export type ColorAreaContextValue = {
  color: HsvColor;
  disabled: boolean;
};

export const [ColorAreaContext, useColorAreaContext] =
  createRequiredContext<ColorAreaContextValue>("ColorArea");

export function normalizeHexColor(value: string) {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(value.trim());
  if (!match?.[1]) return undefined;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) hex = [...hex].map((channel) => channel + channel).join("");
  return `#${hex}`;
}

/**
 * Normalizes a consumer-supplied hex color. An invalid color warns once in
 * development and resolves to `undefined`, so callers choose their fallback.
 */
export function normalizeHexColorProp(warn: Warn, component: string, prop: string, value: string) {
  const normalized = normalizeHexColor(value);
  if (!normalized) {
    warn(
      `${component}:invalid-${prop}:${value}`,
      `${component} ${prop} "${value}" must be a three- or six-digit hex color. It was ignored.`,
    );
  }
  return normalized;
}

export function hexToHsv(value: string): HsvColor {
  const hex = normalizeHexColor(value);
  if (!hex) throw new Error(`Color value "${value}" must be a three- or six-digit hex color.`);
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const difference = maximum - minimum;
  let hue = 0;
  if (difference !== 0 && maximum === red) hue = 60 * (((green - blue) / difference) % 6);
  if (difference !== 0 && maximum === green) hue = 60 * ((blue - red) / difference + 2);
  if (difference !== 0 && maximum === blue) hue = 60 * ((red - green) / difference + 4);
  if (hue < 0) hue += 360;
  return {
    hue,
    saturation: maximum === 0 ? 0 : (difference / maximum) * 100,
    brightness: maximum * 100,
  };
}

export function hsvToHex({ hue, saturation, brightness }: HsvColor) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = Math.min(100, Math.max(0, saturation)) / 100;
  const normalizedBrightness = Math.min(100, Math.max(0, brightness)) / 100;
  const chroma = normalizedBrightness * normalizedSaturation;
  const segment = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;
  if (segment < 1) [red, green] = [chroma, secondary];
  else if (segment < 2) [red, green] = [secondary, chroma];
  else if (segment < 3) [green, blue] = [chroma, secondary];
  else if (segment < 4) [green, blue] = [secondary, chroma];
  else if (segment < 5) [red, blue] = [secondary, chroma];
  else [red, blue] = [chroma, secondary];
  const lightnessOffset = normalizedBrightness - chroma;
  const channel = (value: number) =>
    Math.round((value + lightnessOffset) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

export function colorCoordinatesForValue(previous: HsvColor, value: string) {
  const parsed = hexToHsv(value);
  return {
    hue: parsed.saturation > 0 ? parsed.hue : previous.hue,
    saturation: parsed.brightness > 0 ? parsed.saturation : previous.saturation,
    brightness: parsed.brightness,
  };
}
