import { type ChangeEvent, type ComponentProps, type CSSProperties } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useColorPickerContext } from "./color-picker-shared.js";

export type ColorSliderProps = Omit<
  ComponentProps<"input">,
  "type" | "min" | "max" | "step" | "value" | "defaultValue" | "onChange" | "name"
> &
  AsProp & {
    channel: "hue";
  };

export function ColorSlider({ as, channel, disabled, style, ...props }: ColorSliderProps) {
  const colorPicker = useColorPickerContext("ColorSlider");
  const resolvedDisabled = Boolean(disabled || colorPicker.disabled);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) ariaLabel = "Hue";

  const Part = partElement(as, "input");
  return (
    <Part
      {...props}
      type="range"
      min={0}
      max={360}
      step={1}
      value={colorPicker.color.hue}
      disabled={resolvedDisabled}
      aria-label={ariaLabel}
      aria-valuetext={`${Math.round(colorPicker.color.hue)} degrees`}
      data-slot={dataSlot(props, "color-slider")}
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
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        colorPicker.setColor({ ...colorPicker.color, hue: event.currentTarget.valueAsNumber });
      }}
    />
  );
}
