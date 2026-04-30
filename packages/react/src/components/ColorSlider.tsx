import { type RefProp } from "../shared.js";
import { useContext } from "react";
import { ColorContext, channelValue, setChannel, sliderKeys } from "./color-shared.js";
import { type ColorSliderProps } from "./color-shared.js";
export type { ColorSliderProps } from "./color-shared.js";
export function ColorSlider({
  channel = "hue",
  onKeyDown,
  ref,
  ...props
}: ColorSliderProps & RefProp<HTMLDivElement>) {
  const context = useContext(ColorContext);
  const value = context ? channelValue(context.color, channel) : 0;
  const max = channel === "hue" ? 360 : 100;
  return (
    <div
      {...props}
      ref={ref}
      role="slider"
      tabIndex={props.tabIndex ?? 0}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      data-channel={channel}
      data-slot="color-slider"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && context) {
          sliderKeys(event, value, max, (next) =>
            context.setColor(setChannel(context.color, channel, next)),
          );
        }
      }}
    />
  );
}
