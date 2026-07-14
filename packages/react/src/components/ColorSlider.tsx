import { type CSSProperties, type InputHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useColorPickerContext } from "./color-picker-shared.js";

export type ColorSliderProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "min" | "max" | "step" | "value" | "defaultValue" | "onChange" | "name"
> & {
  channel: "hue";
};

export function ColorSlider({
  channel,
  disabled,
  ref,
  style,
  ...props
}: ColorSliderProps & RefProp<HTMLInputElement>) {
  const colorPicker = useColorPickerContext("ColorSlider");
  const resolvedDisabled = Boolean(disabled || colorPicker.disabled);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) ariaLabel = "Hue";

  return (
    <input
      {...props}
      ref={ref}
      type="range"
      min={0}
      max={360}
      step={1}
      value={colorPicker.color.hue}
      disabled={resolvedDisabled}
      aria-label={ariaLabel}
      aria-valuetext={`${Math.round(colorPicker.color.hue)} degrees`}
      data-channel={channel}
      data-disabled={dataAttr(resolvedDisabled)}
      data-value={colorPicker.color.hue}
      style={
        {
          ...style,
          "--comp0-color-slider-value": `${colorPicker.color.hue}`,
          "--comp0-color-slider-color": colorPicker.value,
        } as CSSProperties
      }
      onChange={(event) => {
        colorPicker.setColor({ ...colorPicker.color, hue: event.currentTarget.valueAsNumber });
      }}
    />
  );
}
