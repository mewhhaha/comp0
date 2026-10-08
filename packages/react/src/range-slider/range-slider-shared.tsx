import { type RefObject } from "react";
import { createRequiredContext } from "../internal/context.js";

export type RangeSliderValue = [start: number, end: number];

export type RangeSliderThumbKind = "start" | "end";

export type RangeSliderContextValue = {
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
};

export const [RangeSliderContext, useRangeSliderContext] =
  createRequiredContext<RangeSliderContextValue>("RangeSlider");
