import { type RefProp } from "../shared.js";
import { type CSSProperties } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type SliderProps } from "./range-shared.js";
export type { SliderProps } from "./range-shared.js";
export function Slider({
  value,
  defaultValue = 0,
  onChange,
  disabled,
  min = 0,
  max = 100,
  step = 1,
  style,
  ref,
  ...props
}: SliderProps & RefProp<HTMLInputElement>) {
  const [sliderValue, setSliderValue] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const resolvedDisabled = Boolean(disabled);

  return (
    <input
      {...props}
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={sliderValue}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      data-orientation="horizontal"
      style={{ ...style, "--comp0-slider-value": `${sliderValue}` } as CSSProperties}
      onChange={(event) => setSliderValue(event.currentTarget.valueAsNumber)}
    />
  );
}
