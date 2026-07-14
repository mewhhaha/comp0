import { type RefProp } from "../shared.js";
import { useRef, type CSSProperties } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type SliderProps } from "./range-shared.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const composedRef = useComposedRefs(inputRef, ref);
  const sliderState = useFormControlState({
    value,
    defaultValue,
    onChange,
  });
  const sliderValue = sliderState.value;
  const resolvedDisabled = Boolean(disabled);
  useFormReset({
    controlRef: inputRef,
    controlled: sliderState.controlled,
    form: props.form,
    resetValue: sliderState.resetValue,
    restoreValue: sliderState.restoreValue,
    readValue: (element) => element.valueAsNumber,
  });

  return (
    <input
      {...props}
      ref={composedRef}
      type="range"
      min={min}
      max={max}
      step={step}
      value={sliderValue}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      data-orientation="horizontal"
      style={{ ...style, "--comp0-slider-value": `${sliderValue}` } as CSSProperties}
      onChange={(event) => sliderState.setValue(event.currentTarget.valueAsNumber)}
    />
  );
}
