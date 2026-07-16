import {
  type ButtonHTMLAttributes,
  createContext,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type RefObject,
  useContext,
} from "react";
import { type InputProps } from "./text-field-shared.js";
export type NumberFieldProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  id?: string | undefined;
  name?: string | undefined;
  value?: number | undefined;
  defaultValue?: number | undefined;
  onChange?: ((value: number) => void) | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
};

export type NumberFieldInputProps = Omit<
  InputProps,
  | "type"
  | "value"
  | "defaultValue"
  | "id"
  | "name"
  | "min"
  | "max"
  | "step"
  | "disabled"
  | "required"
>;

export type NumberFieldIncrementProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export type NumberFieldDecrementProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export type NumberFieldContextValue = {
  controlId: string;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  max: number | undefined;
  min: number | undefined;
  name: string | undefined;
  required: boolean;
  step: number | undefined;
  value: number;
  controlled: boolean;
  announceValue: (value: string) => void;
  setValue: (value: number) => void;
  resetValue: () => void;
  restoreValue: (value: number) => void;
};

export const NumberFieldContext = createContext<NumberFieldContextValue | null>(null);

export function useNumberFieldContext(part: string) {
  const context = useContext(NumberFieldContext);
  if (!context) throw new Error(`${part} must be rendered inside NumberField.`);
  return context;
}

export type SliderProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value?: number | undefined;
  defaultValue?: number | undefined;
  onChange?: ((value: number) => void) | undefined;
  disabled?: boolean | undefined;
};

export type RangeSliderValue = [start: number, end: number];

export type RangeSliderThumbKind = "start" | "end";

export type RangeSliderProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: RangeSliderValue | undefined;
  defaultValue?: RangeSliderValue | undefined;
  /** Receives the next [start, end] pair; shadows the DOM onChange. */
  onChange?: ((value: RangeSliderValue) => void) | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  disabled?: boolean | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  /** Submits two hidden inputs named `${name}-start` and `${name}-end`. */
  name?: string | undefined;
  /** Associates the hidden form controls with a form by id. */
  form?: string | undefined;
};

export type RangeSliderTrackProps = HTMLAttributes<HTMLDivElement>;

export type RangeSliderThumbProps = HTMLAttributes<HTMLDivElement> & {
  /** Which end of the range this thumb controls. */
  thumb: RangeSliderThumbKind;
};

export interface RangeSliderContextValue {
  value: RangeSliderValue;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  orientation: "horizontal" | "vertical";
  trackRef: RefObject<HTMLDivElement | null>;
  registerThumb: (thumb: RangeSliderThumbKind, element: HTMLElement | null) => void;
  focusThumb: (thumb: RangeSliderThumbKind) => void;
  setThumbValue: (thumb: RangeSliderThumbKind, next: number) => void;
}

export const RangeSliderContext = createContext<RangeSliderContextValue | null>(null);

/** Snaps to the step grid anchored at min and clamps into [min, max]. */
export function snapToStep(next: number, min: number, max: number, step: number) {
  const snapped = min + Math.round((next - min) / step) * step;
  const clamped = Math.min(max, Math.max(min, snapped));
  // Trim floating-point residue such as 30.000000000000004.
  return Number(clamped.toFixed(10));
}

/** Converts a pointer position over the track rect into a slider value. */
export function valueAtPointer(
  point: { clientX: number; clientY: number },
  rect: { left: number; bottom: number; width: number; height: number },
  orientation: "horizontal" | "vertical",
  min: number,
  max: number,
  rtl = false,
) {
  let fraction: number;
  if (orientation === "horizontal") {
    if (rect.width === 0) return undefined;
    fraction = (point.clientX - rect.left) / rect.width;
    if (rtl) fraction = 1 - fraction;
  } else {
    if (rect.height === 0) return undefined;
    fraction = (rect.bottom - point.clientY) / rect.height;
  }
  return min + Math.min(1, Math.max(0, fraction)) * (max - min);
}

/** A horizontal track's low end sits on the right in right-to-left layouts. */
export function isRtl(element: HTMLElement) {
  return getComputedStyle(element).direction === "rtl";
}
