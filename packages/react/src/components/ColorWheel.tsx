import { type RefProp } from "../shared.js";
import { useContext, type HTMLAttributes } from "react";
import { ColorContext, sliderKeys } from "./color-shared.js";
export function ColorWheel({
  onKeyDown,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  const context = useContext(ColorContext);
  const value = context?.color.h ?? 0;
  return (
    <div
      {...props}
      ref={ref}
      role="slider"
      tabIndex={props.tabIndex ?? 0}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={value}
      data-slot="color-wheel"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && context) {
          sliderKeys(event, value, 360, (next) => context.setColor({ ...context.color, h: next }));
        }
      }}
    />
  );
}
