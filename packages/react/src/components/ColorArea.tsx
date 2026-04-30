import { type RefProp } from "../shared.js";
import { useContext, type HTMLAttributes } from "react";
import { round, ColorContext, sliderKeys } from "./color-shared.js";
export function ColorArea({
  onKeyDown,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  const context = useContext(ColorContext);
  const saturation = context ? round(context.color.s * 100) : 0;
  return (
    <div
      {...props}
      ref={ref}
      role="slider"
      tabIndex={props.tabIndex ?? 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={saturation}
      data-slot="color-area"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && context) {
          sliderKeys(event, saturation, 100, (next) =>
            context.setColor({ ...context.color, s: next / 100 }),
          );
        }
      }}
    />
  );
}
