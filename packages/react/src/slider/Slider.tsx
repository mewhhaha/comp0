import { useRef, type ChangeEvent, type ComponentProps, type CSSProperties } from "react";
import { dataAttr, useComposedRefs, useControllableState } from "@comp0/core";
import { useFormReset } from "../internal/form-control-state.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type SliderProps = Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange"
> &
  AsProp & {
    value?: number | undefined;
    defaultValue?: number | undefined;
    onChange?: ((value: number) => void) | undefined;
    disabled?: boolean | undefined;
  };

export function Slider({
  as,
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
}: SliderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const composedRef = useComposedRefs(inputRef, ref);
  const [sliderValue, setSlider, sliderState] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const resolvedDisabled = Boolean(disabled);
  useFormReset({
    controlRef: inputRef,
    form: props.form,
    state: sliderState,
    readValue: (element) => element.valueAsNumber,
  });

  const Part = partElement(as, "input");
  return (
    <Part
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
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        setSlider(event.currentTarget.valueAsNumber);
      }}
    />
  );
}
