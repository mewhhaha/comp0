import { createContext, type HTMLAttributes, type KeyboardEvent } from "react";
export type ColorValue = string;

export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
export const round = (value: number) => Math.round(value);

export function rgbToHsva(r: number, g: number, b: number, a = 1): Hsva {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  return { h: (h + 360) % 360, s: max === 0 ? 0 : delta / max, v: max, a };
}

export function hueToRgbComponents(h: number, c: number, x: number): [number, number, number] {
  if (h < 60) return [c, x, 0];
  if (h < 120) return [x, c, 0];
  if (h < 180) return [0, c, x];
  if (h < 240) return [0, x, c];
  if (h < 300) return [x, 0, c];
  return [c, 0, x];
}

export function hsvaToRgb({ h, s, v, a }: Hsva) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = hueToRgbComponents(h, c, x);
  return {
    r: round((r + m) * 255),
    g: round((g + m) * 255),
    b: round((b + m) * 255),
    a,
  };
}

export function hslToRgb(h: number, s: number, l: number, a = 1) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = hueToRgbComponents(h, c, x);
  return { r: round((r + m) * 255), g: round((g + m) * 255), b: round((b + m) * 255), a };
}

export function parseColor(value: string): Hsva | null {
  const input = value.trim();
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input);
  if (hex) {
    const raw = hex[1]!;
    let expanded = raw;
    if (raw.length <= 4) {
      expanded = raw
        .split("")
        .map((char) => `${char}${char}`)
        .join("");
    }
    return rgbToHsva(
      Number.parseInt(expanded.slice(0, 2), 16),
      Number.parseInt(expanded.slice(2, 4), 16),
      Number.parseInt(expanded.slice(4, 6), 16),
      expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    );
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(input);
  if (rgb) {
    const parts = rgb[1]!.split(/[\s,/]+/).filter(Boolean);
    if (parts.length >= 3) {
      return rgbToHsva(
        clamp(Number(parts[0]), 0, 255),
        clamp(Number(parts[1]), 0, 255),
        clamp(Number(parts[2]), 0, 255),
        parts[3] === undefined ? 1 : clamp(Number(parts[3]), 0, 1),
      );
    }
  }
  const hsl = /^hsla?\(([^)]+)\)$/i.exec(input);
  if (hsl) {
    const parts = hsl[1]!.split(/[\s,/]+/).filter(Boolean);
    if (parts.length >= 3) {
      const rgbValue = hslToRgb(
        ((Number(parts[0]) % 360) + 360) % 360,
        clamp(Number.parseFloat(parts[1]!) / 100, 0, 1),
        clamp(Number.parseFloat(parts[2]!) / 100, 0, 1),
        parts[3] === undefined ? 1 : clamp(Number(parts[3]), 0, 1),
      );
      return rgbToHsva(rgbValue.r, rgbValue.g, rgbValue.b, rgbValue.a);
    }
  }
  return null;
}

export function serializeColor(color: Hsva) {
  const { r, g, b, a } = hsvaToRgb(color);
  if (a < 1) return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(2))})`;
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

export interface ColorContextValue {
  value: string;
  color: Hsva;
  invalid: boolean;
  setValue: (value: string) => void;
  setColor: (color: Hsva) => void;
}

export const ColorContext = createContext<ColorContextValue | null>(null);

export type ColorFieldProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: ColorValue | undefined;
  defaultValue?: ColorValue | undefined;
  onChange?: (value: ColorValue) => void;
  name?: string | undefined;
  disabled?: boolean | undefined;
};

export type Channel = "hue" | "saturation" | "brightness" | "alpha";

export function channelValue(color: Hsva, channel: Channel) {
  if (channel === "hue") return round(color.h);
  if (channel === "saturation") return round(color.s * 100);
  if (channel === "brightness") return round(color.v * 100);
  return round(color.a * 100);
}

export function setChannel(color: Hsva, channel: Channel, value: number) {
  if (channel === "hue") return { ...color, h: clamp(value, 0, 360) };
  if (channel === "saturation") return { ...color, s: clamp(value, 0, 100) / 100 };
  if (channel === "brightness") return { ...color, v: clamp(value, 0, 100) / 100 };
  return { ...color, a: clamp(value, 0, 100) / 100 };
}

export type ColorSliderProps = HTMLAttributes<HTMLDivElement> & {
  channel?: Channel | undefined;
};

export function sliderKeys(
  event: KeyboardEvent<HTMLDivElement>,
  current: number,
  max: number,
  apply: (value: number) => void,
) {
  const step = event.shiftKey ? 10 : 1;
  let next: number | undefined;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") next = current + step;
  else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = current - step;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = max;
  if (next === undefined) return;
  event.preventDefault();
  apply(clamp(next, 0, max));
}

export type ColorSwatchProps = HTMLAttributes<HTMLDivElement> & {
  color?: ColorValue | undefined;
};

export type ColorSwatchPickerItemProps = ColorSwatchProps & {
  disabled?: boolean | undefined;
};
